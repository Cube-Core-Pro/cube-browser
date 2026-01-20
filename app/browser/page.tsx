"use client";

import BrowserElite from '@/components/browser/BrowserElite';
import { AppLayout } from '@/components/layout';

export default function BrowserPage() {
  return (
    <AppLayout tier="elite">
      <div className="h-full w-full bg-background">
        <BrowserElite />
      </div>
    </AppLayout>
  );
}
