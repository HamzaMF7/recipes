// components/common/SkipLink.tsx
export function SkipLink({ href = '#content' }: { href?: string }) {
  return (
    <a
      className="sr-only focus:not-sr-only fixed top-2 left-2 z-[9999] bg-white px-3 py-2 rounded"
      href={href}
    >
      Skip to content
    </a>
  );
}
