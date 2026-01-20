import React from 'react';
import './CubeLogo.css';

interface CubeLogoProps {
  variant?: 'full' | 'icon' | 'horizontal';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  theme?: 'light' | 'dark' | 'auto';
  animated?: boolean;
  className?: string;
  showDomain?: boolean;
}

export const CubeLogo: React.FC<CubeLogoProps> = ({
  variant = 'full',
  size = 'md',
  theme = 'auto',
  animated = false,
  className = '',
  showDomain = true,
}) => {
  const sizes = {
    sm: { icon: 24, text: 18, domain: 10 },
    md: { icon: 30, text: 24, domain: 12 },
    lg: { icon: 38, text: 32, domain: 14 },
    xl: { icon: 48, text: 42, domain: 18 },
  };

  const { icon: iconSize, text: textSize, domain: domainSize } = sizes[size];
  const animatedClass = animated ? 'cube-logo--animated' : '';
  const isLight = theme === 'light';

  // Hypercube/Tesseract - Sophisticated wireframe 4D cube projection
  const HypercubeIcon = ({ width, height }: { width: number; height: number }) => (
    <svg
      width={width}
      height={height}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="cube-logo__icon"
    >
      <defs>
        {/* Primary gradient for outer cube */}
        <linearGradient id={`outerGrad-${theme}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isLight ? "#ffffff" : "#3b82f6"} />
          <stop offset="100%" stopColor={isLight ? "#93c5fd" : "#2563eb"} />
        </linearGradient>
        {/* Secondary gradient for inner cube */}
        <linearGradient id={`innerGrad-${theme}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isLight ? "#f0abfc" : "#8b5cf6"} />
          <stop offset="100%" stopColor={isLight ? "#a855f7" : "#7c3aed"} />
        </linearGradient>
        {/* Connection gradient */}
        <linearGradient id={`connGrad-${theme}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isLight ? "#ffffff" : "#3b82f6"} stopOpacity="0.8" />
          <stop offset="100%" stopColor={isLight ? "#c084fc" : "#8b5cf6"} stopOpacity="0.8" />
        </linearGradient>
        {/* Glow filter */}
        <filter id={`hyperGlow-${theme}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={isLight ? "2" : "1"} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      
      <g filter={`url(#hyperGlow-${theme})`}>
        {/* Outer cube - isometric wireframe */}
        <g stroke={`url(#outerGrad-${theme})`} strokeWidth={isLight ? "2.5" : "1.5"} strokeLinecap="round" strokeLinejoin="round" fill="none">
          {/* Top face */}
          <path d="M24 6L40 14L24 22L8 14Z" />
          {/* Left edge */}
          <path d="M8 14V32L24 40V22" />
          {/* Right edge */}
          <path d="M40 14V32L24 40" />
        </g>
        
        {/* Inner cube - smaller, rotated perspective */}
        <g stroke={`url(#innerGrad-${theme})`} strokeWidth={isLight ? "2" : "1.5"} strokeLinecap="round" strokeLinejoin="round" fill="none">
          {/* Top face - inner */}
          <path d="M24 12L34 17L24 22L14 17Z" />
          {/* Left edge - inner */}
          <path d="M14 17V29L24 34V22" />
          {/* Right edge - inner */}
          <path d="M34 17V29L24 34" />
        </g>
        
        {/* 4D connection lines - outer to inner vertices */}
        <g stroke={`url(#connGrad-${theme})`} strokeWidth={isLight ? "1" : "0.75"} strokeLinecap="round" strokeDasharray="2 2" opacity="0.85">
          {/* Top connections */}
          <path d="M24 6L24 12" />
          <path d="M40 14L34 17" />
          <path d="M8 14L14 17" />
          {/* Bottom connections */}
          <path d="M24 40L24 34" />
          <path d="M40 32L34 29" />
          <path d="M8 32L14 29" />
        </g>
        
        {/* AI Spark - elegant small accent */}
        <circle cx="38" cy="8" r="3" fill={isLight ? "#fde047" : "#fbbf24"} />
        <circle cx="38" cy="8" r="4.5" stroke={isLight ? "#fde047" : "#fbbf24"} strokeWidth="0.5" fill="none" opacity="0.5" />
      </g>
    </svg>
  );

  // Icon only
  if (variant === 'icon') {
    return (
      <div className={`cube-logo cube-logo--icon cube-logo--${theme} ${animatedClass} ${className}`}>
        <HypercubeIcon width={iconSize} height={iconSize} />
      </div>
    );
  }

  // Horizontal variant (logo + text in one line) - integrated design
  if (variant === 'horizontal') {
    return (
      <div className={`cube-logo cube-logo--horizontal cube-logo--${size} cube-logo--${theme} ${animatedClass} ${className}`}>
        <HypercubeIcon width={iconSize} height={iconSize} />
        <div className="cube-logo__text">
          <span className="cube-logo__brand" style={{ fontSize: textSize }}>
            <span className="cube-logo__cube">CUBE</span>
            <span className="cube-logo__ai">AI</span>
          </span>
          {showDomain && (
            <span className="cube-logo__domain" style={{ fontSize: domainSize }}>
              .tools
            </span>
          )}
        </div>
      </div>
    );
  }

  // Full variant (stacked)
  return (
    <div className={`cube-logo cube-logo--full cube-logo--${size} cube-logo--${theme} ${animatedClass} ${className}`}>
      <HypercubeIcon width={iconSize * 1.2} height={iconSize * 1.2} />
      <div className="cube-logo__text cube-logo__text--stacked">
        <span className="cube-logo__brand" style={{ fontSize: textSize }}>
          <span className="cube-logo__cube">CUBE</span>
          <span className="cube-logo__ai">AI</span>
        </span>
        {showDomain && (
          <span className="cube-logo__domain" style={{ fontSize: domainSize }}>
            .tools
          </span>
        )}
      </div>
    </div>
  );
};

export default CubeLogo;
