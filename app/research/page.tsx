"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { AppLayout } from '@/components/layout';

const IntelligenceCenter = dynamic(
  () => import('@/components/research/IntelligenceCenter'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-muted-foreground">Loading Intelligence Center...</span>
        </div>
      </div>
    )
  }
);

export default function ResearchPage() {
  return (
    <AppLayout>
      <IntelligenceCenter />
    </AppLayout>
  );
}
