'use client';

/**
 * MobileDrawer Component
 * CUBE Elite v7 - Mobile-friendly Drawer using Vaul
 * 
 * Touch-optimized drawer component for mobile interfaces.
 * Uses vaul library for native-like iOS drawer behavior.
 */

import React from 'react';
import { Drawer } from 'vaul';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/services/logger-service';

const log = logger.scope('MobileDrawer');

// =============================================================================
// Types
// =============================================================================

export interface MobileDrawerProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  trigger?: React.ReactNode;
  title?: string;
  description?: string;
  snapPoints?: (string | number)[];
  defaultSnapPoint?: string | number;
  dismissible?: boolean;
  shouldScaleBackground?: boolean;
  direction?: 'bottom' | 'left' | 'right' | 'top';
  className?: string;
  contentClassName?: string;
}

// =============================================================================
// Component
// =============================================================================

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  open,
  onOpenChange,
  children,
  trigger,
  title,
  description,
  snapPoints,
  defaultSnapPoint,
  dismissible = true,
  shouldScaleBackground = true,
  direction = 'bottom',
  className = '',
  contentClassName = '',
}) => {
  log.debug(`MobileDrawer: ${open ? 'opening' : 'closing'}`);

  return (
    <Drawer.Root
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={snapPoints}
      activeSnapPoint={defaultSnapPoint}
      dismissible={dismissible}
      shouldScaleBackground={shouldScaleBackground}
      direction={direction}
    >
      {trigger && <Drawer.Trigger asChild>{trigger}</Drawer.Trigger>}

      <Drawer.Portal>
        <Drawer.Overlay
          className={cn(
            'fixed inset-0 bg-black/40 z-50',
            className
          )}
        />
        <Drawer.Content
          className={cn(
            'fixed z-50 bg-background rounded-t-[10px] border',
            direction === 'bottom' && 'bottom-0 left-0 right-0 mt-24 max-h-[96%]',
            direction === 'top' && 'top-0 left-0 right-0 mb-24 max-h-[96%]',
            direction === 'left' && 'left-0 top-0 bottom-0 w-[80%] max-w-[400px]',
            direction === 'right' && 'right-0 top-0 bottom-0 w-[80%] max-w-[400px]',
            contentClassName
          )}
        >
          {/* Handle bar for bottom/top drawers */}
          {(direction === 'bottom' || direction === 'top') && (
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted my-4" />
          )}

          {/* Header */}
          {(title || description) && (
            <div className="px-4 pb-4">
              {title && (
                <Drawer.Title className="text-lg font-semibold text-foreground">
                  {title}
                </Drawer.Title>
              )}
              {description && (
                <Drawer.Description className="text-sm text-muted-foreground mt-1">
                  {description}
                </Drawer.Description>
              )}
            </div>
          )}

          {/* Content */}
          <div className="px-4 pb-4 overflow-auto">{children}</div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

// =============================================================================
// Nested Drawer (for multi-level navigation)
// =============================================================================

export interface NestedDrawerProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  trigger?: React.ReactNode;
  title?: string;
}

export const NestedDrawer: React.FC<NestedDrawerProps> = ({
  open,
  onOpenChange,
  children,
  trigger,
  title,
}) => {
  return (
    <Drawer.NestedRoot open={open} onOpenChange={onOpenChange}>
      {trigger && <Drawer.Trigger asChild>{trigger}</Drawer.Trigger>}

      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-[10px] border mt-24 max-h-[96%]">
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted my-4" />
          {title && (
            <div className="px-4 pb-4">
              <Drawer.Title className="text-lg font-semibold text-foreground">
                {title}
              </Drawer.Title>
            </div>
          )}
          <div className="px-4 pb-4 overflow-auto">{children}</div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.NestedRoot>
  );
};

// =============================================================================
// Export
// =============================================================================

export default MobileDrawer;
