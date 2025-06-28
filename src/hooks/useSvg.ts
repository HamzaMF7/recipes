// hooks/useSvg.ts
import { useState, useEffect } from 'react';

interface UseSvgReturn {
  svg: string;
  loading: boolean;
  error: string | null;
}

export function useSvg(iconName: string): UseSvgReturn {
  const [svg, setSvg] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    setLoading(true);
    setError(null);
    
    const loadSvg = async () => {
      try {
        const response = await fetch(`/images/home/${iconName}.svg`);
        
        if (!response.ok) {
          throw new Error(`Failed to load icon: ${iconName} (${response.status})`);
        }
        
        const data = await response.text();
        
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