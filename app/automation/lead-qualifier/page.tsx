"use client";

import { AppLayout } from "@/components/layout";
import AILeadQualifier from "@/components/automation/AILeadQualifier";

export default function LeadQualifierPage() {
  return (
    <AppLayout tier="elite">
      <AILeadQualifier />
    </AppLayout>
  );
}
