'use client';

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Checkout Page Redirect
 * 
 * This page handles checkout redirects. If a plan is specified,
 * it redirects to the proper checkout flow.
 */
export default function CheckoutRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const plan = searchParams.get('plan');
    const interval = searchParams.get('interval') || 'monthly';
    
    if (plan) {
      // Redirect to the checkout with plan
      router.replace(`/checkout/${plan}?interval=${interval}`);
    } else {
      // No plan specified, redirect to pricing
      router.replace('/pricing');
    }
  }, [router, searchParams]);

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: '#f9fafb'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          border: '3px solid #e5e7eb',
          borderTopColor: '#6366f1',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1rem'
        }} />
        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
          Redirecting to checkout...
        </p>
      </div>
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
