"use client";

import { useEffect } from 'react';
import { AppLayout } from '@/components/layout';
import { useRouter } from 'next/navigation';

/**
 * Security Page - Redirects to Security Lab
 * 
 * The main security functionality is located at /security/lab
 * This page provides a redirect for users navigating to /security
 */
export default function SecurityPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/security/lab');
  }, [router]);

  return (
    <AppLayout>
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Redirecting to Security Lab...</p>
      </div>
    </div>
    </AppLayout>
  );
}
