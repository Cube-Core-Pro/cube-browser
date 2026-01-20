"use client";

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import PipelineKanban from '@/components/crm/PipelineKanban';

export default function PipelinePage() {
  return (
    <AppLayout>
      <PipelineKanban />
    </AppLayout>
  );
}
