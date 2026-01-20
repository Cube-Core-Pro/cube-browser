"use client";

import React, { useState, useCallback } from 'react';
import { AppLayout } from '@/components/layout';
import Link from 'next/link';
import { ErrorState } from '@/components/ui/error-state';
import { useTranslation } from '@/hooks/useTranslation';
import './enterprise.css';

/**
 * Enterprise Suite Landing Page
 * 
 * Provides navigation to all enterprise-grade features including:
 * - Workflow Designer
 * - Integration Hub
 * - API Gateway
 * - Pipeline Builder
 * - Observability Dashboard
 * - Security & Compliance
 */
export default function EnterprisePage() {
  const { t } = useTranslation();
  const [_loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRetry = useCallback(() => {
    setError(null);
    setLoading(false);
  }, []);

  const features = [
    {
      id: 'workflows',
      title: 'Workflow Designer',
      description: 'Design and manage complex automation workflows with visual drag-and-drop interface.',
      icon: '🔄',
      href: '/enterprise/workflows',
      status: 'active',
    },
    {
      id: 'integrations',
      title: 'Integration Hub',
      description: 'Connect to 500+ applications and services with pre-built connectors.',
      icon: '🔌',
      href: '/enterprise/integrations',
      status: 'active',
    },
    {
      id: 'api-gateway',
      title: 'API Gateway',
      description: 'Manage, secure, and monitor your APIs with enterprise-grade features.',
      icon: '🌐',
      href: '/enterprise/api-gateway',
      status: 'active',
    },
    {
      id: 'pipelines',
      title: 'Data Pipelines',
      description: 'Build ETL/ELT pipelines with visual designer and real-time monitoring.',
      icon: '📊',
      href: '/enterprise/pipelines',
      status: 'active',
    },
    {
      id: 'observability',
      title: 'Observability',
      description: 'Monitor metrics, traces, and logs with AI-powered insights.',
      icon: '📈',
      href: '/enterprise/observability',
      status: 'active',
    },
    {
      id: 'security',
      title: 'Security & Compliance',
      description: 'Manage access control, audit logs, and compliance frameworks.',
      icon: '🔒',
      href: '/enterprise/security',
      status: 'active',
    },
  ];

  return (
    <AppLayout>
    {error && (
      <ErrorState
        title={t('enterprise.errors.loadFailed')}
        message={error}
        onRetry={handleRetry}
      />
    )}
    {!error && (
    <div className="enterprise-landing">
      <header className="landing-header">
        <div className="header-content">
          <span className="badge">{t('enterprise.badge')}</span>
          <h1>{t('enterprise.title')}</h1>
          <p>
            {t('enterprise.subtitle')}
          </p>
        </div>
        <div className="header-stats">
          <div className="stat">
            <span className="stat-value">6</span>
            <span className="stat-label">{t('enterprise.stats.modules')}</span>
          </div>
          <div className="stat">
            <span className="stat-value">500+</span>
            <span className="stat-label">{t('enterprise.stats.integrations')}</span>
          </div>
          <div className="stat">
            <span className="stat-value">99.9%</span>
            <span className="stat-label">{t('enterprise.stats.uptime')}</span>
          </div>
        </div>
      </header>

      <main className="features-grid">
        {features.map((feature) => (
          <Link
            key={feature.id}
            href={feature.href}
            className={`feature-card status-${feature.status}`}
          >
            <div className="feature-icon">{feature.icon}</div>
            <div className="feature-content">
              <h2>{feature.title}</h2>
              <p>{feature.description}</p>
            </div>
            <div className="feature-arrow">→</div>
          </Link>
        ))}
      </main>

      <section className="enterprise-benefits">
        <h2>{t('enterprise.benefits.title')}</h2>
        <div className="benefits-grid">
          <div className="benefit-item">
            <span className="benefit-icon">🛡️</span>
            <h3>{t('enterprise.benefits.security.title')}</h3>
            <p>{t('enterprise.benefits.security.description')}</p>
          </div>
          <div className="benefit-item">
            <span className="benefit-icon">⚡</span>
            <h3>{t('enterprise.benefits.performance.title')}</h3>
            <p>{t('enterprise.benefits.performance.description')}</p>
          </div>
          <div className="benefit-item">
            <span className="benefit-icon">🔄</span>
            <h3>{t('enterprise.benefits.uptime.title')}</h3>
            <p>{t('enterprise.benefits.uptime.description')}</p>
          </div>
          <div className="benefit-item">
            <span className="benefit-icon">📞</span>
            <h3>{t('enterprise.benefits.support.title')}</h3>
            <p>{t('enterprise.benefits.support.description')}</p>
          </div>
        </div>
      </section>
    </div>
    )}
    </AppLayout>
  );
}
