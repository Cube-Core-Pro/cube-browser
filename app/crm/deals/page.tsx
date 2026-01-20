"use client";

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import DealsManager from '@/components/crm/DealsManager';

export default function DealsPage() {
  return (
    <AppLayout>
      <DealsManager />
    </AppLayout>
  );
}
