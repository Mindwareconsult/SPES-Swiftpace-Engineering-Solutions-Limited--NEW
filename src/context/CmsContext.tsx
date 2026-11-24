import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import snapshotData from '../generated/cms-snapshot.json';
import type { CmsBootstrapPayload } from '../types';

interface CmsContextValue extends CmsBootstrapPayload {
  isRefreshing: boolean;
  refreshCms: () => Promise<void>;
}

const INITIAL_PAYLOAD = snapshotData as CmsBootstrapPayload;

const CmsContext = createContext<CmsContextValue>({
  ...INITIAL_PAYLOAD,
  isRefreshing: false,
  refreshCms: async () => undefined
});

export const CmsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cms, setCms] = useState<CmsBootstrapPayload>(INITIAL_PAYLOAD);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshCms = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/public/bootstrap', {
        headers: { Accept: 'application/json' }
      });
      if (res.ok) {
        const live = (await res.json()) as CmsBootstrapPayload;
        if (live && Array.isArray(live.projects) && live.settings) {
          setCms(live);
        }
      }
    } catch {
      // Keep bundled snapshot silently when offline or in static fallback
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    refreshCms();
  }, [refreshCms]);

  // Synchronize favicon dynamically if changed in Admin Settings
  useEffect(() => {
    const faviconHref = cms.settings?.faviconUrl;
    if (!faviconHref) return;
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (link && link.getAttribute('href') !== faviconHref) {
      link.setAttribute('href', faviconHref);
    }
  }, [cms.settings?.faviconUrl]);

  return (
    <CmsContext.Provider value={{ ...cms, isRefreshing, refreshCms }}>
      {children}
    </CmsContext.Provider>
  );
};

export function useCms(): CmsContextValue {
  return useContext(CmsContext);
}
