"use client";

import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useTranslations } from '@/components/providers/I18nProvider';
import { Inbox, Search, FileX, FolderOpen, Users, AlertCircle } from 'lucide-react';

/** Preset icons for common empty states */
export type EmptyStatePreset = 'default' | 'search' | 'noFiles' | 'noFolder' | 'noUsers' | 'error';

const presetIcons: Record<EmptyStatePreset, ReactNode> = {
  default: <Inbox className="h-12 w-12" />,
  search: <Search className="h-12 w-12" />,
  noFiles: <FileX className="h-12 w-12" />,
  noFolder: <FolderOpen className="h-12 w-12" />,
  noUsers: <Users className="h-12 w-12" />,
  error: <AlertCircle className="h-12 w-12" />,
};

interface EmptyStateProps {
  /** Custom icon element - overrides preset */
  icon?: ReactNode;
  /** Use a preset icon */
  preset?: EmptyStatePreset;
  /** Title text - required */
  title: string;
  /** Description text */
  description?: string;
  /** Primary action button */
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary' | 'ghost';
    icon?: ReactNode;
  };
  /** Secondary action button */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** Additional CSS classes */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Test ID for e2e testing */
  testId?: string;
}

export function EmptyState({
  icon,
  preset = 'default',
  title,
  description,
  action,
  secondaryAction,
  className,
  size = 'md',
  testId = 'empty-state',
}: EmptyStateProps) {
  const { t: _t } = useTranslations('common');
  
  const displayIcon = icon ?? presetIcons[preset];
  
  const sizeClasses = {
    sm: 'p-4',
    md: 'p-8',
    lg: 'p-12',
  };
  
  const iconSizeClasses = {
    sm: '[&_svg]:h-8 [&_svg]:w-8',
    md: '[&_svg]:h-12 [&_svg]:w-12',
    lg: '[&_svg]:h-16 [&_svg]:w-16',
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
      role="status"
      aria-label={title}
      data-testid={testId}
    >
      {displayIcon && (
        <div className={cn(
          "mb-4 text-muted-foreground/50",
          iconSizeClasses[size]
        )}>
          {displayIcon}
        </div>
      )}
      <h3 className={cn("font-semibold", titleSizeClasses[size])}>{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-muted-foreground max-w-sm">
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          {action && (
            <Button
              onClick={action.onClick}
              variant={action.variant ?? 'outline'}
            >
              {action.icon}
              {action.label}
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

/** Quick empty state for search results */
export function NoResultsState({
  searchTerm,
  onClear,
  className,
}: {
  searchTerm?: string;
  onClear?: () => void;
  className?: string;
}) {
  const { t } = useTranslations('common');
  
  return (
    <EmptyState
      preset="search"
      title={t('noResults')}
      description={searchTerm 
        ? t('noResultsFor', { term: searchTerm }) 
        : t('tryDifferentSearch')
      }
      action={onClear ? {
        label: t('clear'),
        onClick: onClear,
        variant: 'outline',
      } : undefined}
      className={className}
      testId="no-results-state"
    />
  );
}

/** Quick empty state for data lists */
export function NoDataState({
  entityName,
  onAdd,
  className,
}: {
  entityName: string;
  onAdd?: () => void;
  className?: string;
}) {
  const { t } = useTranslations('common');
  
  return (
    <EmptyState
      preset="default"
      title={t('noData')}
      description={t('noDataDescription', { entity: entityName })}
      action={onAdd ? {
        label: t('add'),
        onClick: onAdd,
        variant: 'default',
      } : undefined}
      className={className}
      testId="no-data-state"
    />
  );
}
