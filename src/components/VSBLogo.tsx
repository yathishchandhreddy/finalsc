import React, { useState, useEffect } from 'react';

interface VSBLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export function VSBLogo({ className = '', size = 'md', showText = false }: VSBLogoProps) {
  const [customLogo, setCustomLogo] = useState<string | null>(() => {
    try {
      return localStorage.getItem('custom_vsb_logo');
    } catch {
      return null;
    }
  });

  const [imgSrc, setImgSrc] = useState<string>('/vsb_crest.png');

  useEffect(() => {
    const handleLogoUpdate = () => {
      try {
        const stored = localStorage.getItem('custom_vsb_logo');
        setCustomLogo(stored);
        if (stored) {
          setImgSrc(stored);
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener('vsb-logo-updated', handleLogoUpdate);
    return () => window.removeEventListener('vsb-logo-updated', handleLogoUpdate);
  }, []);

  useEffect(() => {
    if (customLogo) {
      setImgSrc(customLogo);
    } else {
      setImgSrc('/vsb_crest.png');
    }
  }, [customLogo]);

  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  return (
    <div className={`flex items-center gap-2.5 shrink-0 ${className}`}>
      <div
        className={`relative shrink-0 ${sizeClasses[size]} rounded-lg bg-white overflow-hidden flex items-center justify-center transition-transform hover:scale-105`}
        title="V.S.B. Engineering College Official Emblem"
      >
        <img
          src={imgSrc}
          alt="V.S.B. Engineering College Official Crest"
          className="w-full h-full object-contain drop-shadow-xs"
          onError={() => {
            if (imgSrc !== '/vsb_logo.svg') {
              setImgSrc('/vsb_logo.svg');
            }
          }}
        />
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className="text-xs font-bold text-slate-900 tracking-tight leading-tight">
            VSB Engineering College
          </span>
          <span className="text-[10px] text-slate-500 font-medium leading-none mt-0.5">
            Autonomous • Karur, TN
          </span>
        </div>
      )}
    </div>
  );
}
