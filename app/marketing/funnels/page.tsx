"use client";

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import FunnelBuilder from '@/components/marketing/FunnelBuilder';

export default function FunnelsPage() {
  return (
    <AppLayout>
      <FunnelBuilder />
    </AppLayout>
  );
}
