/**
 * CUBE Nexum - Branding Settings API
 * 
 * SuperAdmin endpoint for managing brand assets:
 * - Logo (light/dark variants)
 * - Favicon
 * - Colors (primary, secondary, accent)
 * - Typography
 * - Social media links
 * - App store links
 * 
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// TYPES
// ============================================================================

interface BrandColors {
  primary: string;
  primaryHover: string;
  secondary: string;
  secondaryHover: string;
  accent: string;
  accentHover: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  background: string;
  backgroundSecondary: string;
  foreground: string;
  foregroundMuted: string;
  border: string;
}

interface BrandTypography {
  fontFamily: string;
  fontFamilyMono: string;
  fontSizeBase: string;
  fontWeightNormal: number;
  fontWeightMedium: number;
  fontWeightBold: number;
  lineHeightBase: number;
}

interface BrandLogo {
  light: string;
  dark: string;
  icon: string;
  iconLight: string;
  iconDark: string;
}

interface SocialLinks {
  twitter: string;
  linkedin: string;
  github: string;
  youtube: string;
  discord: string;
  instagram: string;
  facebook: string;
}

interface AppStoreLinks {
  windows: string;
  macos: string;
  linux: string;
  ios: string;
  android: string;
  chromeExtension: string;
  firefoxExtension: string;
}

interface BrandSettings {
  siteName: string;
  siteTagline: string;
  siteDescription: string;
  siteUrl: string;
  supportEmail: string;
  salesEmail: string;
  pressEmail: string;
  colors: BrandColors;
  colorsDark: BrandColors;
  typography: BrandTypography;
  logos: BrandLogo;
  favicon: string;
  ogImage: string;
  socialLinks: SocialLinks;
  appStoreLinks: AppStoreLinks;
  copyrightText: string;
  footerLinks: Array<{
    title: string;
    links: Array<{ label: string; href: string; }>;
  }>;
}

// ============================================================================
// DEFAULT BRANDING
// ============================================================================

const defaultBrandSettings: BrandSettings = {
  siteName: 'CUBE AI',
  siteTagline: 'Enterprise AI Tools. Unlimited Potential.',
  siteDescription: 'The most powerful browser automation and enterprise AI platform. CUBE Nexum for automation, CubeMail for private email, CUBE Core for enterprise solutions.',
  siteUrl: 'https://cubeai.tools',
  supportEmail: 'support@cubeai.tools',
  salesEmail: 'sales@cubeai.tools',
  pressEmail: 'press@cubeai.tools',
  colors: {
    primary: '#8b5cf6',
    primaryHover: '#7c3aed',
    secondary: '#06b6d4',
    secondaryHover: '#0891b2',
    accent: '#f59e0b',
    accentHover: '#d97706',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    background: '#ffffff',
    backgroundSecondary: '#f9fafb',
    foreground: '#1f2937',
    foregroundMuted: '#6b7280',
    border: '#e5e7eb'
  },
  colorsDark: {
    primary: '#a78bfa',
    primaryHover: '#8b5cf6',
    secondary: '#22d3ee',
    secondaryHover: '#06b6d4',
    accent: '#fbbf24',
    accentHover: '#f59e0b',
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
    info: '#60a5fa',
    background: '#0f172a',
    backgroundSecondary: '#1e293b',
    foreground: '#f8fafc',
    foregroundMuted: '#94a3b8',
    border: '#334155'
  },
  typography: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontFamilyMono: 'JetBrains Mono, Menlo, Monaco, Consolas, monospace',
    fontSizeBase: '16px',
    fontWeightNormal: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
    lineHeightBase: 1.5
  },
  logos: {
    light: '/images/logo-light.svg',
    dark: '/images/logo-dark.svg',
    icon: '/images/logo-icon.svg',
    iconLight: '/images/logo-icon-light.svg',
    iconDark: '/images/logo-icon-dark.svg'
  },
  favicon: '/favicon.ico',
  ogImage: '/images/og-image.png',
  socialLinks: {
    twitter: 'https://twitter.com/cubeai',
    linkedin: 'https://linkedin.com/company/cubeai',
    github: 'https://github.com/cubeai',
    youtube: 'https://youtube.com/@cubeai',
    discord: 'https://discord.gg/cubeai',
    instagram: 'https://instagram.com/cubeai',
    facebook: 'https://facebook.com/cubeai'
  },
  appStoreLinks: {
    windows: '/downloads/cube-nexum-windows.exe',
    macos: '/downloads/cube-nexum-macos.dmg',
    linux: '/downloads/cube-nexum-linux.AppImage',
    ios: 'https://apps.apple.com/app/cubemail',
    android: 'https://play.google.com/store/apps/details?id=tools.cubeai.mail',
    chromeExtension: 'https://chrome.google.com/webstore/detail/cube-nexum',
    firefoxExtension: 'https://addons.mozilla.org/firefox/addon/cube-nexum'
  },
  copyrightText: '© 2026 CUBE AI Technologies Inc. All rights reserved.',
  footerLinks: [
    {
      title: 'Products',
      links: [
        { label: 'CUBE Nexum', href: '/downloads' },
        { label: 'CubeMail', href: '/cubemail' },
        { label: 'CUBE Core', href: '/cube-core' },
        { label: 'Pricing', href: '/#pricing' }
      ]
    },
    {
      title: 'Resources',
      links: [
        { label: 'Documentation', href: '/docs' },
        { label: 'API Reference', href: '/api-docs' },
        { label: 'Blog', href: '/blog' },
        { label: 'Help Center', href: '/help' }
      ]
    },
    {
      title: 'Company',
      links: [
        { label: 'About Us', href: '/about' },
        { label: 'Careers', href: '/careers' },
        { label: 'Press Kit', href: '/press' },
        { label: 'Contact', href: '/contact' }
      ]
    },
    {
      title: 'Legal',
      links: [
        { label: 'Terms of Service', href: '/legal/terms' },
        { label: 'Privacy Policy', href: '/legal/privacy' },
        { label: 'Cookie Policy', href: '/legal/cookies' },
        { label: 'GDPR', href: '/legal/gdpr' }
      ]
    }
  ]
};

// In-memory storage (replace with database in production)
let brandSettings: BrandSettings = { ...defaultBrandSettings };

// ============================================================================
// GET - Fetch brand settings
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section');

    // Return specific section
    if (section) {
      switch (section) {
        case 'colors':
          return NextResponse.json({
            success: true,
            colors: brandSettings.colors,
            colorsDark: brandSettings.colorsDark
          });
        case 'typography':
          return NextResponse.json({
            success: true,
            typography: brandSettings.typography
          });
        case 'logos':
          return NextResponse.json({
            success: true,
            logos: brandSettings.logos,
            favicon: brandSettings.favicon,
            ogImage: brandSettings.ogImage
          });
        case 'social':
          return NextResponse.json({
            success: true,
            socialLinks: brandSettings.socialLinks
          });
        case 'appStores':
          return NextResponse.json({
            success: true,
            appStoreLinks: brandSettings.appStoreLinks
          });
        case 'footer':
          return NextResponse.json({
            success: true,
            footerLinks: brandSettings.footerLinks,
            copyrightText: brandSettings.copyrightText
          });
        default:
          return NextResponse.json(
            { error: 'Invalid section' },
            { status: 400 }
          );
      }
    }

    // Return all settings
    return NextResponse.json({
      success: true,
      settings: brandSettings
    });
  } catch (error) {
    console.error('Error fetching brand settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch brand settings' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Update brand settings section
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { section, data } = body;

    if (!section || !data) {
      return NextResponse.json(
        { error: 'Section and data required' },
        { status: 400 }
      );
    }

    switch (section) {
      case 'general':
        brandSettings = {
          ...brandSettings,
          siteName: data.siteName || brandSettings.siteName,
          siteTagline: data.siteTagline || brandSettings.siteTagline,
          siteDescription: data.siteDescription || brandSettings.siteDescription,
          siteUrl: data.siteUrl || brandSettings.siteUrl,
          supportEmail: data.supportEmail || brandSettings.supportEmail,
          salesEmail: data.salesEmail || brandSettings.salesEmail,
          pressEmail: data.pressEmail || brandSettings.pressEmail
        };
        break;

      case 'colors':
        brandSettings.colors = { ...brandSettings.colors, ...data.colors };
        if (data.colorsDark) {
          brandSettings.colorsDark = { ...brandSettings.colorsDark, ...data.colorsDark };
        }
        break;

      case 'typography':
        brandSettings.typography = { ...brandSettings.typography, ...data };
        break;

      case 'logos':
        brandSettings.logos = { ...brandSettings.logos, ...data.logos };
        if (data.favicon) brandSettings.favicon = data.favicon;
        if (data.ogImage) brandSettings.ogImage = data.ogImage;
        break;

      case 'social':
        brandSettings.socialLinks = { ...brandSettings.socialLinks, ...data };
        break;

      case 'appStores':
        brandSettings.appStoreLinks = { ...brandSettings.appStoreLinks, ...data };
        break;

      case 'footer':
        if (data.footerLinks) brandSettings.footerLinks = data.footerLinks;
        if (data.copyrightText) brandSettings.copyrightText = data.copyrightText;
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid section' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `${section} settings updated successfully`
    });
  } catch (error) {
    console.error('Error updating brand settings:', error);
    return NextResponse.json(
      { error: 'Failed to update brand settings' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT - Bulk update all settings
// ============================================================================

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.settings) {
      return NextResponse.json(
        { error: 'Settings object required' },
        { status: 400 }
      );
    }

    brandSettings = {
      ...brandSettings,
      ...body.settings
    };

    return NextResponse.json({
      success: true,
      message: 'All brand settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating brand settings:', error);
    return NextResponse.json(
      { error: 'Failed to update brand settings' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Reset to defaults
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section');

    if (section) {
      // Reset specific section
      switch (section) {
        case 'colors':
          brandSettings.colors = { ...defaultBrandSettings.colors };
          brandSettings.colorsDark = { ...defaultBrandSettings.colorsDark };
          break;
        case 'typography':
          brandSettings.typography = { ...defaultBrandSettings.typography };
          break;
        case 'logos':
          brandSettings.logos = { ...defaultBrandSettings.logos };
          brandSettings.favicon = defaultBrandSettings.favicon;
          brandSettings.ogImage = defaultBrandSettings.ogImage;
          break;
        case 'social':
          brandSettings.socialLinks = { ...defaultBrandSettings.socialLinks };
          break;
        case 'appStores':
          brandSettings.appStoreLinks = { ...defaultBrandSettings.appStoreLinks };
          break;
        case 'footer':
          brandSettings.footerLinks = [...defaultBrandSettings.footerLinks];
          brandSettings.copyrightText = defaultBrandSettings.copyrightText;
          break;
        default:
          return NextResponse.json(
            { error: 'Invalid section' },
            { status: 400 }
          );
      }

      return NextResponse.json({
        success: true,
        message: `${section} settings reset to defaults`
      });
    }

    // Reset all settings
    brandSettings = { ...defaultBrandSettings };

    return NextResponse.json({
      success: true,
      message: 'All brand settings reset to defaults'
    });
  } catch (error) {
    console.error('Error resetting brand settings:', error);
    return NextResponse.json(
      { error: 'Failed to reset brand settings' },
      { status: 500 }
    );
  }
}

// ============================================================================
// Generate CSS Variables
// ============================================================================

export async function OPTIONS() {
  // Generate CSS variables from current brand settings
  const cssVariables = `
:root {
  /* Primary Colors */
  --color-primary: ${brandSettings.colors.primary};
  --color-primary-hover: ${brandSettings.colors.primaryHover};
  --color-secondary: ${brandSettings.colors.secondary};
  --color-secondary-hover: ${brandSettings.colors.secondaryHover};
  --color-accent: ${brandSettings.colors.accent};
  --color-accent-hover: ${brandSettings.colors.accentHover};
  
  /* Status Colors */
  --color-success: ${brandSettings.colors.success};
  --color-warning: ${brandSettings.colors.warning};
  --color-error: ${brandSettings.colors.error};
  --color-info: ${brandSettings.colors.info};
  
  /* Background & Foreground */
  --color-background: ${brandSettings.colors.background};
  --color-background-secondary: ${brandSettings.colors.backgroundSecondary};
  --color-foreground: ${brandSettings.colors.foreground};
  --color-foreground-muted: ${brandSettings.colors.foregroundMuted};
  --color-border: ${brandSettings.colors.border};
  
  /* Typography */
  --font-family: ${brandSettings.typography.fontFamily};
  --font-family-mono: ${brandSettings.typography.fontFamilyMono};
  --font-size-base: ${brandSettings.typography.fontSizeBase};
  --font-weight-normal: ${brandSettings.typography.fontWeightNormal};
  --font-weight-medium: ${brandSettings.typography.fontWeightMedium};
  --font-weight-bold: ${brandSettings.typography.fontWeightBold};
  --line-height-base: ${brandSettings.typography.lineHeightBase};
}

.dark {
  --color-primary: ${brandSettings.colorsDark.primary};
  --color-primary-hover: ${brandSettings.colorsDark.primaryHover};
  --color-secondary: ${brandSettings.colorsDark.secondary};
  --color-secondary-hover: ${brandSettings.colorsDark.secondaryHover};
  --color-accent: ${brandSettings.colorsDark.accent};
  --color-accent-hover: ${brandSettings.colorsDark.accentHover};
  --color-success: ${brandSettings.colorsDark.success};
  --color-warning: ${brandSettings.colorsDark.warning};
  --color-error: ${brandSettings.colorsDark.error};
  --color-info: ${brandSettings.colorsDark.info};
  --color-background: ${brandSettings.colorsDark.background};
  --color-background-secondary: ${brandSettings.colorsDark.backgroundSecondary};
  --color-foreground: ${brandSettings.colorsDark.foreground};
  --color-foreground-muted: ${brandSettings.colorsDark.foregroundMuted};
  --color-border: ${brandSettings.colorsDark.border};
}
`.trim();

  return new NextResponse(cssVariables, {
    headers: {
      'Content-Type': 'text/css'
    }
  });
}
