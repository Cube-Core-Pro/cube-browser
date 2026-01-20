"use client";

import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, WifiOff, ServerCrash, ShieldAlert, FileWarning, Bug } from 'lucide-react';
import { useTranslations } from '@/components/providers/I18nProvider';

/** Preset error types with specific icons and default messages */
export type ErrorPreset = 'generic' | 'network' | 'server' | 'auth' | 'notFound' | 'validation';

const presetConfig: Record<ErrorPreset, { icon: ReactNode; titleKey: string }> = {
  generic: { icon: <AlertCircle className="h-8 w-8" />, titleKey: 'errors.generic' },
  network: { icon: <WifiOff className="h-8 w-8" />, titleKey: 'errors.network' },
  server: { icon: <ServerCrash className="h-8 w-8" />, titleKey: 'errors.server' },
  auth: { icon: <ShieldAlert className="h-8 w-8" />, titleKey: 'errors.auth' },
  notFound: { icon: <FileWarning className="h-8 w-8" />, titleKey: 'errors.notFound' },
  validation: { icon: <Bug className="h-8 w-8" />, titleKey: 'errors.validation' },
};

export interface ErrorStateProps {
  /** Custom title - overrides preset title */
  title?: string;
  /** Error message to display */
  message?: string;
  /** Alias for message - for backward compatibility */
  description?: string;
  /** Retry callback */
  onRetry?: () => void;
  /** Custom retry label */
  retryLabel?: string;
  /** Additional action */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** Additional CSS classes */
  className?: string;
  /** Error preset type */
  preset?: ErrorPreset;
  /** Custom icon - overrides preset icon */
  icon?: ReactNode;
  /** Error code for debugging */
  errorCode?: string;
  /** Show technical details */
  showDetails?: boolean;
  /** Technical error details */
  details?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Test ID for e2e testing */
  testId?: string;
}

export function ErrorState({
  title,
  message,
  description,
  onRetry,
  retryLabel,
  secondaryAction,
  className,
  preset = 'generic',
  icon,
  errorCode,
  showDetails = false,
  details,
  size = 'md',
  testId = 'error-state',
}: ErrorStateProps) {
  const { t } = useTranslations();
  
  const config = presetConfig[preset];
  const displayIcon = icon ?? config.icon;
  const displayTitle = title ?? t(config.titleKey);
  const displayRetryLabel = retryLabel ?? t('common.retry');
  // Support both message and description props for backward compatibility
  const displayMessage = message ?? description ?? t('errors.unknownError');
  
  const sizeClasses = {
    sm: 'p-4',
    md: 'p-8',
    lg: 'p-12',
  };
  
  const iconContainerClasses = {
    sm: 'p-2 [&_svg]:h-6 [&_svg]:w-6',
    md: 'p-3 [&_svg]:h-8 [&_svg]:w-8',
    lg: 'p-4 [&_svg]:h-10 [&_svg]:w-10',
  };
  
  const titleSizeClasses = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
  };
  
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        sizeClasses[size],
        className
      )}
      role="alert"
      aria-live="assertive"
      data-testid={testId}
    >
      <div className={cn(
        "mb-4 rounded-full bg-destructive/10",
        iconContainerClasses[size]
      )}>
        <div className="text-destructive">
          {displayIcon}
        </div>
      </div>
      <h3 className={cn("font-semibold", titleSizeClasses[size])}>{displayTitle}</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm">
        {displayMessage}
      </p>
      {errorCode && (
        <p className="mt-1 text-xs text-muted-foreground/60 font-mono">
          {t('errors.code')}: {errorCode}
        </p>
      )}
      {showDetails && details && (
        <details className="mt-3 w-full max-w-md">
          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
            {t('errors.showDetails')}
          </summary>
          <pre className="mt-2 p-3 rounded-md bg-muted/50 text-xs text-left overflow-auto max-h-32 font-mono">
            {details}
          </pre>
        </details>
      )}
      {(onRetry || secondaryAction) && (
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          {onRetry && (
            <Button
              onClick={onRetry}
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {displayRetryLabel}
            </Button>
          )}
          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant="ghost"
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/** Network error state with auto-retry suggestion */
export function NetworkErrorState({
  onRetry,
  className,
}: {
  onRetry?: () => void;
  className?: string;
}) {
  const { t } = useTranslations('errors');
  
  return (
    <ErrorState
      preset="network"
      message={t('networkDescription')}
      onRetry={onRetry}
      className={className}
      testId="network-error-state"
    />
  );
}

/** Server error state */
export function ServerErrorState({
  onRetry,
  errorCode,
  className,
}: {
  onRetry?: () => void;
  errorCode?: string;
  className?: string;
}) {
  const { t } = useTranslations('errors');
  
  return (
    <ErrorState
      preset="server"
      message={t('serverDescription')}
      onRetry={onRetry}
      errorCode={errorCode}
      className={className}
      testId="server-error-state"
    />
  );
}

/** Auth error state */
export function AuthErrorState({
  onLogin,
  className,
}: {
  onLogin?: () => void;
  className?: string;
}) {
  const { t } = useTranslations('errors');
  
  return (
    <ErrorState
      preset="auth"
      message={t('authDescription')}
      secondaryAction={onLogin ? {
        label: t('login'),
        onClick: onLogin,
      } : undefined}
      className={className}
      testId="auth-error-state"
    />
  );
}
