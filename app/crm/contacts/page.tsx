"use client";

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import ContactsManager from '@/components/crm/ContactsManager';

export default function ContactsPage() {
  return (
    <AppLayout>
      <ContactsManager />
    </AppLayout>
  );
}
