// hooks/useSvg.ts
import { useEffect, useState } from 'react';

interface UseSvgReturn {
  svg: string;
  loading: boolean;
  error: string | null;
}

const svgCache = new Map<string, string>();

export function useSvg(iconName: string): UseSvgReturn {
  const [svg, setSvg] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!iconName) {
      setSvg('');
      setError('Icon name is required');
      setLoading(false);
      return () => {
        isMounted = false;
      };
    }

    if (svgCache.has(iconName)) {
      setSvg(svgCache.get(iconName) ?? '');
      setLoading(false);
      setError(null);
      return () => {
        isMounted = false;
      };
    }

    setLoading(true);
    setError(null);

    const loadSvg = async () => {
      try {
        if (typeof window === 'undefined') {
          setLoading(false);
          return;
        }

        const response = await fetch(`/images/${iconName}.svg`);

        if (!response.ok) {
          throw new Error(`Failed to load icon: ${iconName} (${response.status})`);
        }

        const data = await response.text();
        svgCache.set(iconName, data);

        if (isMounted) {
          setSvg(data);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
          setError(errorMessage);
          setLoading(false);
        }
      }
    };

    loadSvg();

    return () => {
      isMounted = false;
    };
  }, [iconName]);

  return { svg, loading, error };
}
