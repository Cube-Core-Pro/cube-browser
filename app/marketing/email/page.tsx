"use client";

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import EmailCampaigns from '@/components/marketing/EmailCampaigns';

export default function EmailPage() {
  return (
    <AppLayout>
      <EmailCampaigns />
    </AppLayout>
  );
}
