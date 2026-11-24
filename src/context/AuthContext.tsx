import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

export interface AdminStatusInfo {
  initialized: boolean;
  needsClaim: boolean;
  configuredUsername: string;
  envPasswordConfigured: boolean;
  cmsMode: 'github' | 'local';
}

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  username: string | null;
  statusInfo: AdminStatusInfo | null;
  login: (username: string, password: string) => Promise<void>;
  claimInitialPassword: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshStatus: () => Promise<AdminStatusInfo | null>;
  adminFetch: (url: string, init?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const [statusInfo, setStatusInfo] = useState<AdminStatusInfo | null>(null);

  // Security mandate: keep JWT strictly in React memory (never localStorage or sessionStorage)
  const tokenRef = useRef<string | null>(null);

  const refreshStatus = useCallback(async (): Promise<AdminStatusInfo | null> => {
    try {
      const res = await fetch('/api/admin/status', { credentials: 'include' });
      if (res.ok) {
        const info = (await res.json()) as AdminStatusInfo;
        setStatusInfo(info);
        return info;
      }
    } catch {
      // Ignore network status error
    }
    return null;
  }, []);

  const adminFetch = useCallback(async (url: string, init: RequestInit = {}): Promise<Response> => {
    const headers = new Headers(init.headers || {});
    headers.set('X-Requested-With', 'XMLHttpRequest');
    if (tokenRef.current && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${tokenRef.current}`);
    }
    return fetch(url, {
      ...init,
      headers,
      credentials: 'include'
    });
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await refreshStatus();
        const meRes = await adminFetch('/api/admin/me');
        if (!active) return;
        if (meRes.ok) {
          const data = (await meRes.json()) as { username?: string };
          setIsAuthenticated(true);
          setUsername(data.username || 'spesadmin');
        } else {
          setIsAuthenticated(false);
          setUsername(null);
        }
      } catch {
        if (active) {
          setIsAuthenticated(false);
          setUsername(null);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [adminFetch, refreshStatus]);

  const login = useCallback(async (userInput: string, password: string) => {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      credentials: 'include',
      body: JSON.stringify({ username: userInput, password })
    });
    const data = (await res.json().catch(() => ({}))) as {
      token?: string;
      username?: string;
      error?: string;
    };
    if (!res.ok || !data.token) {
      throw new Error(data.error || 'Authentication failed.');
    }
    tokenRef.current = data.token;
    setUsername(data.username || userInput);
    setIsAuthenticated(true);
  }, []);

  const claimInitialPassword = useCallback(
    async (userInput: string, password: string) => {
      const res = await fetch('/api/admin/claim-initial-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'include',
        body: JSON.stringify({ username: userInput, password })
      });
      const data = (await res.json().catch(() => ({}))) as {
        token?: string;
        username?: string;
        error?: string;
      };
      if (!res.ok || !data.token) {
        throw new Error(data.error || 'Failed to set initial administrator password.');
      }
      tokenRef.current = data.token;
      setUsername(data.username || userInput);
      setIsAuthenticated(true);
      await refreshStatus();
    },
    [refreshStatus]
  );

  const logout = useCallback(async () => {
    try {
      await adminFetch('/api/admin/logout', { method: 'POST' });
    } catch {
      // Clear local session regardless
    }
    tokenRef.current = null;
    setIsAuthenticated(false);
    setUsername(null);
  }, [adminFetch]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        username,
        statusInfo,
        login,
        claimInitialPassword,
        logout,
        refreshStatus,
        adminFetch
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
