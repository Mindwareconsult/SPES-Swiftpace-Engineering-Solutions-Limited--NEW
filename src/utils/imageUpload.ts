export type UploadFolder = 'projects' | 'blog' | 'services' | 'gallery' | 'branding';

const MAX_UPLOAD_BYTES = 3.6 * 1024 * 1024; // Keep safely below 4 MB server / 6 MB Netlify ceiling

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read selected file.'));
    reader.readAsDataURL(file);
  });
}

async function compressRasterImage(file: File): Promise<{ filename: string; dataUrl: string }> {
  const originalDataUrl = await readFileAsDataUrl(file);
  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  // Keep SVGs, GIFs, or already compact files untouched
  if (ext === 'svg' || ext === 'gif' || file.size <= 1.4 * 1024 * 1024) {
    return { filename: file.name, dataUrl: originalDataUrl };
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 2000;
      let width = img.naturalWidth;
      let height = img.naturalHeight;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({ filename: file.name, dataUrl: originalDataUrl });
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      const outputMime = ext === 'png' && file.size < 2.5 * 1024 * 1024 ? 'image/png' : 'image/jpeg';
      const outputExt = outputMime === 'image/png' ? '.png' : '.jpg';
      const baseName = file.name.replace(/\.[^.]+$/, '');
      const compressed = canvas.toDataURL(outputMime, 0.86);
      resolve({
        filename: `${baseName}${outputExt}`,
        dataUrl: compressed
      });
    };
    img.onerror = () => resolve({ filename: file.name, dataUrl: originalDataUrl });
    img.src = originalDataUrl;
  });
}

export async function prepareAndUploadImage(
  file: File,
  folder: UploadFolder,
  adminFetch: (url: string, init?: RequestInit) => Promise<Response>,
  subFolder?: string
): Promise<{ url: string; filename: string; persistedTo: 'github' | 'local' }> {
  const allowedExt = /\.(jpg|jpeg|png|webp|gif|svg)$/i;
  if (!allowedExt.test(file.name)) {
    throw new Error('Unsupported image format. Please choose a JPG, PNG, WEBP, GIF, or SVG file.');
  }

  const prepared = await compressRasterImage(file);
  const approxBytes = Math.ceil((prepared.dataUrl.length * 3) / 4);
  if (approxBytes > MAX_UPLOAD_BYTES) {
    throw new Error('Image remains larger than 3.6 MB after compression. Please choose a smaller image.');
  }

  const res = await adminFetch('/api/admin/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      folder,
      filename: prepared.filename,
      base64Data: prepared.dataUrl,
      subFolder
    })
  });

  const data = (await res.json().catch(() => ({}))) as {
    url?: string;
    filename?: string;
    persistedTo?: 'github' | 'local';
    error?: string;
  };

  if (!res.ok || !data.url) {
    throw new Error(data.error || 'Failed to upload image.');
  }

  return {
    url: data.url,
    filename: data.filename || prepared.filename,
    persistedTo: data.persistedTo || 'local'
  };
}
