"use client";

/**
 * CUBE Mail - Main Page
 * 
 * Full-featured email client page accessible at /mail
 * 
 * Features:
 * - Multi-account email management
 * - E2E encryption support
 * - AI-powered categorization
 * - HEY-inspired Screener
 * - Modern, responsive UI
 * 
 * @version 1.0.0
 */

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Dynamic import for better performance
const CubeMail = dynamic(
  () => import('@/components/mail/CubeMail').then(mod => ({ default: mod.CubeMail })),
  {
    loading: () => <MailLoadingState />,
    ssr: false, // Email client is client-side only
  }
);

function MailLoadingState() {
  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
        <div className="text-center">
          <h2 className="text-xl font-semibold">Loading CUBE Mail</h2>
          <p className="text-muted-foreground mt-1">
            Preparing your secure email client...
          </p>
        </div>
      </div>
    </div>
  );
}

export default function MailPage() {
  return (
    <div className="h-screen w-full overflow-hidden">
      <Suspense fallback={<MailLoadingState />}>
        <CubeMail className="h-full" />
      </Suspense>
    </div>
  );
}
