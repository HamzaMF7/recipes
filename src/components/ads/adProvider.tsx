// components/ads/AdProvider.tsx
import React, { createContext, useContext, useEffect } from 'react';

type Provider = 'gpt' | 'adsense' | 'none' | 'custom';
const AdsContext = createContext<{ provider: Provider }>({ provider: 'none' });

export function AdProvider({ children }: { children: React.ReactNode }) {
  const provider = (process.env.NEXT_PUBLIC_ADS_PROVIDER as Provider) || 'none';

  // Example: hook point to initialize a provider once
  useEffect(() => {
    if (provider === 'gpt') {
      (window as any).googletag = (window as any).googletag || { cmd: [] };
    }
  }, [provider]);

  return <AdsContext.Provider value={{ provider }}>{children}</AdsContext.Provider>;
}

export function useAds() {
  return useContext(AdsContext);
}
