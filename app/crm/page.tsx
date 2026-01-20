"use client";

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import CRMHub from '@/components/crm/CRMHub';

export default function CRMPage() {
  return (
    <AppLayout>
      <CRMHub />
    </AppLayout>
  );
}
