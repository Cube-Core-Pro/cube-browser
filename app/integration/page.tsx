"use client";

import React from 'react';
import { AppLayout } from '@/components/layout';
import IntegrationDashboard from '@/components/integration/IntegrationDashboard';
import { useTranslation } from '@/hooks/useTranslation';

/**
 * Integration Hub Page
 * 
 * Central management interface for cross-module integration.
 * Provides unified view of all module connections, data flows,
 * and synchronization status.
 */
export default function IntegrationPage() {
  const { t: _t } = useTranslation();

  return (
    <AppLayout>
      <IntegrationDashboard />
    </AppLayout>
  );
}
