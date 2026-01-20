"use client";

import React from 'react';
import { AppLayout } from '@/components/layout';
import { useTranslation } from '@/hooks/useTranslation';
import dynamic from 'next/dynamic';

const AdminPanel = dynamic(
  () => import('@/components/admin/AdminPanel'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-muted-foreground">Loading Admin Panel...</span>
        </div>
      </div>
    )
  }
);

export default function AdminPage() {
  const { t: _t } = useTranslation();

  return (
    <AppLayout>
      <AdminPanel />
    </AppLayout>
  );
}
