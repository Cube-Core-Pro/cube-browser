"use client";

import DataExtractor from "@/components/DataExtractor";
import { AppLayout } from '@/components/layout';
import { useTranslation } from '@/hooks/useTranslation';

/**
 * Data Extractor Page
 * Visual web scraping tool with point-and-click interface
 */
export default function DataExtractorPage() {
  const { t: _t } = useTranslation();

  return (
    <AppLayout tier="elite">
      <DataExtractor />
    </AppLayout>
  );
}
