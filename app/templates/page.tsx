"use client";

import React from 'react';
import { AppLayout } from '@/components/layout';
import { TemplateGallery } from '@/components/templates';

export default function TemplatesPage() {
  return (
    <AppLayout>
      <div className="h-full overflow-auto p-6">
        <TemplateGallery />
      </div>
    </AppLayout>
  );
}
