"use client";

import { AppLayout } from '@/components/layout';
import { AIAssistant } from '@/components/ai';
import { useSettingsStore } from '@/stores';

export default function AIPage() {
  const { settings } = useSettingsStore();

  return (
    <AppLayout tier={settings.tier}>
      <div className="p-8">
        <AIAssistant />
      </div>
    </AppLayout>
  );
}
