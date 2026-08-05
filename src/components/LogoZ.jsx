import React, { useState } from 'react';

/**
 * LogoZ Component
 * Renders the official "Donde los Zambrano" logo image cleanly.
 * Includes state-based fallback to prevent infinite 404 onError loops or flickering.
 */
export const LogoZ = ({ size = 'medium', className = '' }) => {
  const [imgError, setImgError] = useState(false);

  const dimensions = {
    xsmall:  'w-8 h-8',
    small:   'w-12 h-12',
    medium:  'w-20 h-20',
    large:   'w-32 h-32',
    xlarge:  'w-44 h-44',
    xxlarge: 'w-56 h-56',
  }[size] || 'w-20 h-20';

  const fontSizes = {
    xsmall:  'text-xs',
    small:   'text-sm',
    medium:  'text-xl',
    large:   'text-3xl',
    xlarge:  'text-4xl',
    xxlarge: 'text-5xl',
  }[size] || 'text-xl';

  return (
    <div className={`inline-flex items-center justify-center select-none filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] ${className}`}>
      {!imgError ? (
        <img
          src="/logo-zambrano-full.png"
          alt="Donde los Zambrano Logo"
          loading="eager"
          decoding="async"
          className={`${dimensions} object-contain transition-transform hover:scale-105 duration-300`}
          onError={() => setImgError(true)}
        />
      ) : (
        <div className={`${dimensions} rounded-2xl bg-gradient-to-br from-red-600 via-amber-500 to-amber-600 flex items-center justify-center font-black text-slate-950 shadow-xl border-2 border-amber-300 ${fontSizes}`}>
          Z
        </div>
      )}
    </div>
  );
};
