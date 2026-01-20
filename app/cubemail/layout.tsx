/**
 * CubeMail Layout
 * 
 * Shared layout for all CubeMail pages.
 * Provides consistent metadata and structure.
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'CubeMail - Email Without Compromise',
    template: '%s | CubeMail'
  },
  description: 'Free, private, and powerful email. Get your @cubemail.pro address today. No ads. No tracking. No compromises on your privacy.',
  keywords: [
    'free email',
    'private email',
    'secure email',
    'email service',
    'cubemail',
    'no ads email',
    'privacy email',
    'encrypted email',
    'email alternative',
    'gmail alternative'
  ],
  authors: [{ name: 'CubeMail Team' }],
  creator: 'CubeMail',
  publisher: 'CubeMail',
  robots: {
    index: true,
    follow: true
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://cubemail.pro',
    title: 'CubeMail - Email Without Compromise',
    description: 'Free, private, and powerful email. Get your @cubemail.pro address today.',
    siteName: 'CubeMail',
    images: [
      {
        url: '/cubemail-og.png',
        width: 1200,
        height: 630,
        alt: 'CubeMail - Email Without Compromise'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CubeMail - Email Without Compromise',
    description: 'Free, private, and powerful email. Get your @cubemail.pro address today.',
    images: ['/cubemail-og.png'],
    creator: '@cubemail'
  },
  icons: {
    icon: '/cubemail-favicon.ico',
    shortcut: '/cubemail-favicon-16x16.png',
    apple: '/cubemail-apple-touch-icon.png'
  },
  manifest: '/cubemail-manifest.json',
  alternates: {
    canonical: 'https://cubemail.pro'
  }
};

export default function CubeMailLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
    </>
  );
}
