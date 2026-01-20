"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { useTranslations } from '@/components/providers/I18nProvider';

export interface LoadingStateProps {
  /** Custom message to display - if not provided, uses i18n default */
  message?: string;
  /** Alias for message - for backward compatibility */
  title?: string;
  /** Subtitle/description to show below the main message */
  description?: string;
  /** Additional CSS classes */
  className?: string;
  /** Size of the loading indicator */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Visual variant of the loader */
  variant?: 'spinner' | 'dots' | 'pulse' | 'bars';
  /** Hide the message entirely */
  hideMessage?: boolean;
  /** ARIA label for accessibility */
  ariaLabel?: string;
  /** Test ID for e2e testing */
  testId?: string;
}

export function LoadingState({
  message,
  title,
  description,
  className,
  size = 'md',
  variant = 'spinner',
  hideMessage = false,
  ariaLabel,
  testId = 'loading-state',
}: LoadingStateProps) {
  const { t } = useTranslations('common');
  // Support both message and title props for backward compatibility
  const displayMessage = message ?? title ?? t('loading');
  const accessibleLabel = ariaLabel ?? displayMessage;
  
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  const renderLoader = () => {
    switch (variant) {
      case 'dots':
        return (
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  "rounded-full bg-primary",
                  size === 'sm' ? 'h-1.5 w-1.5' : size === 'md' ? 'h-2 w-2' : size === 'lg' ? 'h-3 w-3' : 'h-4 w-4'
                )}
                style={{
                  animation: 'bounce 1.4s ease-in-out infinite',
                  animationDelay: `${i * 0.16}s`,
                }}
              />
            ))}
          </div>
        );
      case 'pulse':
        return (
          <div 
            className={cn(
              "rounded-full bg-primary/20",
              sizeClasses[size]
            )}
          >
            <div 
              className="h-full w-full rounded-full bg-primary animate-ping"
              style={{ animationDuration: '1.5s' }}
            />
          </div>
        );
      case 'bars':
        return (
          <div className="flex items-end gap-1">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  "rounded-full bg-primary",
                  size === 'sm' ? 'w-1' : size === 'md' ? 'w-1.5' : size === 'lg' ? 'w-2' : 'w-2.5'
                )}
                style={{
                  height: size === 'sm' ? '16px' : size === 'md' ? '24px' : size === 'lg' ? '32px' : '40px',
                  animation: 'loading-bars 1s ease-in-out infinite',
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        );
      default:
        return (
          <Loader2 
            className={cn(
              "animate-spin text-primary",
              sizeClasses[size]
            )} 
          />
        );
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8",
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={accessibleLabel}
      data-testid={testId}
    >
      {renderLoader()}
      {!hideMessage && (displayMessage || description) && (
        <div className="mt-4 text-center">
          {displayMessage && (
            <p className="text-sm text-muted-foreground animate-pulse">
              {displayMessage}
            </p>
          )}
          {description && (
            <p className="mt-1 text-xs text-muted-foreground/70">
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

interface LoadingOverlayProps {
  /** Custom message to display */
  message?: string;
  /** Additional CSS classes */
  className?: string;
  /** Apply blur effect to background */
  blur?: boolean;
  /** Test ID for e2e testing */
  testId?: string;
}

export function LoadingOverlay({
  message,
  className,
  blur = true,
  testId = 'loading-overlay',
}: LoadingOverlayProps) {
  const { t } = useTranslations('common');
  const displayMessage = message ?? t('loading');
  
  return (
    <div
      className={cn(
        "absolute inset-0 flex items-center justify-center z-50",
        blur ? "bg-background/80 backdrop-blur-sm" : "bg-background/90",
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={displayMessage}
      data-testid={testId}
    >
      <div className="flex flex-col items-center animate-fade-in">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
          <Loader2 className="h-10 w-10 animate-spin text-primary relative" />
        </div>
        {displayMessage && (
          <p className="mt-4 text-sm font-medium text-muted-foreground">
            {displayMessage}
          </p>
        )}
      </div>
    </div>
  );
}

interface SkeletonLoaderProps {
  lines?: number;
  className?: string;
  variant?: 'text' | 'card' | 'avatar' | 'image' | 'table';
}

export function SkeletonLoader({
  lines = 3,
  className,
  variant = 'text',
}: SkeletonLoaderProps) {
  const widths = ['w-3/4', 'w-full', 'w-5/6', 'w-2/3', 'w-4/5'];
  
  if (variant === 'card') {
    return (
      <div className={cn("rounded-xl border bg-card p-6 space-y-4", className)}>
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full skeleton" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/3 rounded skeleton" />
            <div className="h-3 w-1/4 rounded skeleton" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-4 w-full rounded skeleton" />
          <div className="h-4 w-5/6 rounded skeleton" />
          <div className="h-4 w-4/6 rounded skeleton" />
        </div>
      </div>
    );
  }
  
  if (variant === 'avatar') {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <div className="h-10 w-10 rounded-full skeleton" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-24 rounded skeleton" />
          <div className="h-3 w-16 rounded skeleton" />
        </div>
      </div>
    );
  }
  
  if (variant === 'image') {
    return (
      <div className={cn("aspect-video w-full rounded-xl skeleton", className)} />
    );
  }
  
  if (variant === 'table') {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="flex gap-4 p-4 border-b">
          <div className="h-4 w-1/4 rounded skeleton" />
          <div className="h-4 w-1/4 rounded skeleton" />
          <div className="h-4 w-1/4 rounded skeleton" />
          <div className="h-4 w-1/4 rounded skeleton" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 p-4">
            <div className="h-4 w-1/4 rounded skeleton" />
            <div className="h-4 w-1/4 rounded skeleton" />
            <div className="h-4 w-1/4 rounded skeleton" />
            <div className="h-4 w-1/4 rounded skeleton" />
          </div>
        ))}
      </div>
    );
  }
  
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-4 rounded skeleton",
            widths[i % widths.length]
          )}
        />
      ))}
    </div>
  );
}

// Progress loader with percentage
interface ProgressLoaderProps {
  progress: number;
  message?: string;
  className?: string;
  showPercentage?: boolean;
}

export function ProgressLoader({
  progress,
  message,
  className,
  showPercentage = true,
}: ProgressLoaderProps) {
  return (
    <div className={cn("w-full space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        {message && <span className="text-muted-foreground">{message}</span>}
        {showPercentage && (
          <span className="font-medium text-primary">{Math.round(progress)}%</span>
        )}
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500 ease-out relative overflow-hidden"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
        </div>
      </div>
    </div>
  );
}

// Inline spinner for buttons/text
interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export function Spinner({ size = 'sm', className }: SpinnerProps) {
  const sizes = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
  };
  
  return (
    <Loader2 
      className={cn(
        "animate-spin",
        sizes[size],
        className
      )} 
    />
  );
}

// Add keyframes via style tag
if (typeof document !== 'undefined') {
  const styleId = 'loading-animations';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes loading-bars {
        0%, 100% { transform: scaleY(0.4); }
        50% { transform: scaleY(1); }
      }
      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
    `;
    document.head.appendChild(style);
  }
}
