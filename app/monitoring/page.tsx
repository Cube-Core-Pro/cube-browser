"use client";

import { AppLayout } from "@/components/layout";
import WebsiteMonitor from "@/components/monitoring/WebsiteMonitor";
import { useTranslation } from "@/hooks/useTranslation";

export default function WebsiteMonitorPage() {
  const { t: _t } = useTranslation();

  return (
    <AppLayout tier="elite">
      <WebsiteMonitor />
    </AppLayout>
  );
}
