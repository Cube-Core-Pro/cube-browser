"use client";

import React from 'react';
import { AppLayout } from '@/components/layout';
import { ROIDashboard } from '@/components/dashboard';

export default function ROIDashboardPage() {
  return (
    <AppLayout>
      <div className="h-full overflow-auto p-6">
        <ROIDashboard />
      </div>
    </AppLayout>
  );
}
