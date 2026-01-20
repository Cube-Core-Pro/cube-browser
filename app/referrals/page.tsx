"use client";

import React from 'react';
import { AppLayout } from '@/components/layout';
import { ReferralCenter } from '@/components/referral';

export default function ReferralsPage() {
  return (
    <AppLayout>
      <div className="h-full overflow-auto p-6">
        <ReferralCenter />
      </div>
    </AppLayout>
  );
}
