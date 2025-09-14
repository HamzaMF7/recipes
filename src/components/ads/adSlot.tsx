// components/ads/AdSlot.tsx
import React, { useEffect, useId, useRef } from 'react';
import { useAds } from './adProvider';

type Sizes = { desktop?: number[][]; mobile?: number[][] };
type Props = {
  id: string;
  className?: string;
  sizes?: Sizes;
  viewportRules?: { min?: number; max?: number };
  lazy?: boolean;
  ariaLabel?: string;
};

export function AdSlot({ id, className, sizes, viewportRules, lazy = true, ariaLabel = 'Advertisement' }: Props) {
  const { provider } = useAds();
  const slotId = useId().replace(/:/g, '');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    if (provider === 'none') return;
    if (provider === 'gpt') {
      const g = (window as any).googletag;
      if (!g?.cmd) return;

      g.cmd.push(() => {
        const slot = g.defineSlot(`/123456/${id}`, sizes?.desktop || [[728, 90]], ref.current!.id)
          ?.addService(g.pubads());
        g.pubads().enableSingleRequest();
        g.enableServices();
        g.display(ref.current!.id);
      });
    }

    if (provider === 'adsense') {
      // Example: data attributes; your ads.txt must be correct for production
      if (ref.current && !ref.current.querySelector('ins')) {
        const ins = document.createElement('ins');
        ins.className = 'adsbygoogle';
        ins.setAttribute('style', 'display:block');
        ins.setAttribute('data-ad-client', process.env.NEXT_PUBLIC_ADSENSE_CLIENT || '');
        ins.setAttribute('data-ad-slot', process.env.NEXT_PUBLIC_ADSENSE_SLOT || '');
        ins.setAttribute('data-full-width-responsive', 'true');
        ref.current.appendChild(ins);
        (window as any).adsbygoogle = (window as any).adsbygoogle || [];
        (window as any).adsbygoogle.push({});
      }
    }
  }, [provider, id, sizes]);

  // simple lazy render
  useEffect(() => {
    if (!lazy || !ref.current) return;
    const el = ref.current;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && io.disconnect()),
      { rootMargin: '100px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [lazy]);

  return (
    <div
      id={`ad_${id}_${slotId}`}
      ref={ref}
      role="complementary"
      aria-label={ariaLabel}
      className={className}
      data-viewport-min={viewportRules?.min ?? 0}
      data-viewport-max={viewportRules?.max ?? 10000}
    >
      {/* Fallback for ad blockers / slow networks */}
      <div className="text-center text-xs text-gray-600" aria-hidden="true">Ad</div>
    </div>
  );
}
