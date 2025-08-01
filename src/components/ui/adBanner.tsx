import React from 'react';

interface AdBannerProps {
  width: number;
  height: number;
  position: 'top' | 'bottom' | 'sidebar-square' | 'sidebar-skyscraper';
  className?: string;
}

const AdBanner: React.FC<AdBannerProps> = ({ width, height, position, className = '' }) => {
  const adStyles = {
    width: `${width}px`,
    height: `${height}px`,
    backgroundColor: '#f8f9fa',
    border: '2px dashed #dee2e6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column' as const,
    color: '#6c757d',
    fontSize: '14px',
    textAlign: 'center' as const,
  };

  return (
    <div className={`${className} mx-auto`}>
      <div style={adStyles} className="rounded-lg">
        <div className="mb-2 text-xs uppercase tracking-wide opacity-60">Advertisement</div>
        <div className="font-medium">{width} x {height}</div>
        <div className="text-xs mt-1 capitalize">{position.replace('-', ' ')}</div>
      </div>
    </div>
  );
};

export default AdBanner ; 