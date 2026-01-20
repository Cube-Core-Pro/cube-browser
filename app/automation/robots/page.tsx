"use client";

import { AppLayout } from "@/components/layout";
import PrebuiltRobots from "@/components/automation/PrebuiltRobots";

export default function PrebuiltRobotsPage() {
  return (
    <AppLayout tier="elite">
      <PrebuiltRobots />
    </AppLayout>
  );
}
