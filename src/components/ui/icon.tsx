// components/Icon.tsx
import { useSvg } from '@/hooks/useSvg';
import React from 'react';

interface IconProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  size?: number | string;
  className?: string;
  color?: string;
  strokeWidth?: number;
  'aria-label'?: string;
}

// export function Icon({ 
//   name, 
//   size = 24, 
//   className = '', 
//   color = 'currentColor',
//   strokeWidth,
//   'aria-label': ariaLabel,
//   ...props 
// }: IconProps): JSX.Element {
//   const { svg, loading, error } = useSvg(name);

//   // Composant de loading
//   if (loading) {
//     return (
//       <div 
//         className={`animate-pulse bg-gray-200 rounded ${className}`}
//         style={{ width: size, height: size }}
//         role="img"
//         aria-label={ariaLabel || `Loading ${name} icon`}
//         {...props}
//       />
//     );
//   }

//   // Composant d'erreur
//   if (error) {
//     console.warn(`Icon error: ${error}`);
//     return (
//       <div 
//         className={`bg-red-100 text-red-500 text-xs flex items-center justify-center rounded border border-red-200 ${className}`}
//         style={{ width: size, height: size }}
//         role="img"
//         aria-label={ariaLabel || `Error loading ${name} icon`}
//         title={error}
//         {...props}
//       >
//         !
//       </div>
//     );
//   }

//   // Modifier le SVG pour appliquer les props
//   const modifiedSvg = React.useMemo(() => {
//     let modifiedContent = svg;
    
//     // Appliquer la couleur
//     if (color && color !== 'currentColor') {
//       modifiedContent = modifiedContent
//         .replace(/fill="[^"]*"/g, `fill="${color}"`)
//         .replace(/stroke="[^"]*"/g, `stroke="${color}"`);
//     } else if (color === 'currentColor') {
//       modifiedContent = modifiedContent
//         .replace(/fill="[^"]*"/g, 'fill="currentColor"')
//         .replace(/stroke="[^"]*"/g, 'stroke="currentColor"');
//     }
    
//     // Appliquer la taille
//     modifiedContent = modifiedContent
//       .replace(/width="[^"]*"/g, `width="${size}"`)
//       .replace(/height="[^"]*"/g, `height="${size}"`);
    
//     // Appliquer strokeWidth si spécifié
//     if (strokeWidth) {
//       modifiedContent = modifiedContent
//         .replace(/stroke-width="[^"]*"/g, `stroke-width="${strokeWidth}"`);
//     }
    
//     return modifiedContent;
//   }, [svg, color, size, strokeWidth]);

//   return (
//     <div
//       className={`inline-flex items-center justify-center ${className}`}
//       style={{ width: size, height: size }}
//       dangerouslySetInnerHTML={{ __html: modifiedSvg }}
//       role="img"
//       aria-label={ariaLabel || `${name} icon`}
//       {...props}
//     />
//   );
// }



export function Icon({ 
  name, 
  size = 24, 
  className = '', 
  color = 'currentColor',
  strokeWidth,
  'aria-label': ariaLabel,
  ...props 
}: IconProps): JSX.Element {
  const { svg, loading, error } = useSvg(name);

  // Déplacer useMemo AVANT les returns conditionnels
  const modifiedSvg = React.useMemo(() => {
    if (!svg) return ''; // Gérer le cas où svg n'existe pas encore
    
    let modifiedContent = svg;
    
    // Appliquer la couleur
    if (color && color !== 'currentColor') {
      modifiedContent = modifiedContent
        .replace(/fill="[^"]*"/g, `fill="${color}"`)
        .replace(/stroke="[^"]*"/g, `stroke="${color}"`);
    } else if (color === 'currentColor') {
      modifiedContent = modifiedContent
        .replace(/fill="[^"]*"/g, 'fill="currentColor"')
        .replace(/stroke="[^"]*"/g, 'stroke="currentColor"');
    }
    
    // Appliquer la taille
    modifiedContent = modifiedContent
      .replace(/width="[^"]*"/g, `width="${size}"`)
      .replace(/height="[^"]*"/g, `height="${size}"`);
    
    // Appliquer strokeWidth si spécifié
    if (strokeWidth) {
      modifiedContent = modifiedContent
        .replace(/stroke-width="[^"]*"/g, `stroke-width="${strokeWidth}"`);
    }
    
    return modifiedContent;
  }, [svg, color, size, strokeWidth]);

  // Maintenant les conditions après tous les hooks
  if (loading) {
    return (
      <div 
        className={`animate-pulse bg-gray-200 rounded ${className}`}
        style={{ width: size, height: size }}
        role="img"
        aria-label={ariaLabel || `Loading ${name} icon`}
        {...props}
      />
    );
  }

  if (error) {
    console.warn(`Icon error: ${error}`);
    return (
      <div 
        className={`bg-red-100 text-red-500 text-xs flex items-center justify-center rounded border border-red-200 ${className}`}
        style={{ width: size, height: size }}
        role="img"
        aria-label={ariaLabel || `Error loading ${name} icon`}
        title={error}
        {...props}
      >
        !
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: modifiedSvg }}
      role="img"
      aria-label={ariaLabel || `${name} icon`}
      {...props}
    />
  );
}