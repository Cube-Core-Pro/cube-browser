"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { AppLayout } from '@/components/layout';
import { useTranslation } from '@/hooks/useTranslation';

const AISearchEngine = dynamic(
  () => import('@/components/search/AISearchEngine'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-muted-foreground">Loading AI Search Engine...</span>
        </div>
      </div>
    )
  }
);

export default function SearchPage() {
  const { t: _t } = useTranslation();

  return (
    <AppLayout>
      <AISearchEngine />
    </AppLayout>
  );
}
