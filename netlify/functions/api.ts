import type { Context } from '@netlify/functions';
import serverless from 'serverless-http';
import { createApp } from '../../server/app.ts';

const app = createApp();

const expressHandler = serverless(app, {
  binary: ['image/*', 'application/octet-stream']
});

interface LambdaEventLike {
  httpMethod: string;
  path: string;
  headers: Record<string, string>;
  multiValueHeaders: Record<string, string[]>;
  queryStringParameters: Record<string, string> | null;
  multiValueQueryStringParameters: Record<string, string[]> | null;
  body: string;
  isBase64Encoded: boolean;
  requestContext: {
    requestId: string;
    identity: {
      sourceIp: string;
    };
  };
}

interface LambdaResponseLike {
  statusCode?: number;
  headers?: Record<string, string | number | boolean>;
  multiValueHeaders?: Record<string, Array<string | number | boolean>>;
  body?: string;
  isBase64Encoded?: boolean;
}

function normalizeNetlifyPathname(rawPathname: string): string {
  let normalizedPath = rawPathname || '/';
  const fnPrefix = '/.netlify/functions/api';
  if (normalizedPath.startsWith(fnPrefix)) {
    normalizedPath = normalizedPath.slice(fnPrefix.length) || '/';
  }
  if (!normalizedPath.startsWith('/')) {
    normalizedPath = `/${normalizedPath}`;
  }
  return normalizedPath;
}

async function webRequestToLambdaEvent(req: Request, context?: Partial<Context>): Promise<LambdaEventLike> {
  const parsedUrl = new URL(req.url);
  const path = normalizeNetlifyPathname(parsedUrl.pathname);

  const headers: Record<string, string> = {};
  const multiValueHeaders: Record<string, string[]> = {};
  req.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    headers[lowerKey] = headers[lowerKey] ? `${headers[lowerKey]}, ${value}` : value;
    if (!multiValueHeaders[lowerKey]) {
      multiValueHeaders[lowerKey] = [];
    }
    multiValueHeaders[lowerKey].push(value);
  });

  if (!headers.host && parsedUrl.host) {
    headers.host = parsedUrl.host;
    multiValueHeaders.host = [parsedUrl.host];
  }

  const queryStringParameters: Record<string, string> = {};
  const multiValueQueryStringParameters: Record<string, string[]> = {};
  let hasQuery = false;
  parsedUrl.searchParams.forEach((value, key) => {
    hasQuery = true;
    queryStringParameters[key] = value;
    if (!multiValueQueryStringParameters[key]) {
      multiValueQueryStringParameters[key] = [];
    }
    multiValueQueryStringParameters[key].push(value);
  });

  let body = '';
  let isBase64Encoded = false;
  const method = (req.method || 'GET').toUpperCase();
  if (method !== 'GET' && method !== 'HEAD' && req.body !== null) {
    const buffer = Buffer.from(await req.arrayBuffer());
    if (buffer.length > 0) {
      body = buffer.toString('base64');
      isBase64Encoded = true;
    }
  }

  const sourceIp =
    context?.ip ||
    headers['x-nf-client-connection-ip'] ||
    headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    '127.0.0.1';

  return {
    httpMethod: method,
    path,
    headers,
    multiValueHeaders,
    queryStringParameters: hasQuery ? queryStringParameters : null,
    multiValueQueryStringParameters: hasQuery ? multiValueQueryStringParameters : null,
    body,
    isBase64Encoded,
    requestContext: {
      requestId: context?.requestId || '',
      identity: {
        sourceIp
      }
    }
  };
}

function lambdaResponseToWebResponse(lambdaRes: LambdaResponseLike): Response {
  const statusCode = typeof lambdaRes?.statusCode === 'number' ? lambdaRes.statusCode : 500;
  const responseHeaders = new Headers();

  if (lambdaRes?.headers) {
    for (const [key, value] of Object.entries(lambdaRes.headers)) {
      if (value !== undefined && value !== null) {
        responseHeaders.set(key, String(value));
      }
    }
  }

  if (lambdaRes?.multiValueHeaders) {
    for (const [key, values] of Object.entries(lambdaRes.multiValueHeaders)) {
      if (!Array.isArray(values) || values.length === 0) continue;
      responseHeaders.delete(key);
      for (const value of values) {
        if (value !== undefined && value !== null) {
          responseHeaders.append(key, String(value));
        }
      }
    }
  }

  if (statusCode === 204 || statusCode === 205 || statusCode === 304) {
    return new Response(null, { status: statusCode, headers: responseHeaders });
  }

  if (lambdaRes?.isBase64Encoded) {
    const bytes = Buffer.from(lambdaRes.body || '', 'base64');
    return new Response(new Uint8Array(bytes), {
      status: statusCode,
      headers: responseHeaders
    });
  }

  return new Response(lambdaRes?.body ?? '', {
    status: statusCode,
    headers: responseHeaders
  });
}

export default async function handler(req: Request, context: Context): Promise<Response> {
  const lambdaEvent = await webRequestToLambdaEvent(req, context);
  const lambdaContext = {
    awsRequestId: context?.requestId || '',
    functionName: 'api'
  };
  const lambdaRes = (await expressHandler(lambdaEvent, lambdaContext as any)) as LambdaResponseLike;
  return lambdaResponseToWebResponse(lambdaRes);
}
