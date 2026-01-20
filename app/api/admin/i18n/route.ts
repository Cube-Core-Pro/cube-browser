/**
 * CUBE Nexum - Internationalization API
 * 
 * Manages 12+ languages with auto-detection
 * 
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';

// Supported languages (internal, not exported from route)
const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', flag: '🇺🇸', rtl: false },
  { code: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸', rtl: false },
  { code: 'pt', name: 'Portuguese', native: 'Português', flag: '🇧🇷', rtl: false },
  { code: 'fr', name: 'French', native: 'Français', flag: '🇫🇷', rtl: false },
  { code: 'de', name: 'German', native: 'Deutsch', flag: '🇩🇪', rtl: false },
  { code: 'it', name: 'Italian', native: 'Italiano', flag: '🇮🇹', rtl: false },
  { code: 'zh', name: 'Chinese', native: '中文', flag: '🇨🇳', rtl: false },
  { code: 'ja', name: 'Japanese', native: '日本語', flag: '🇯🇵', rtl: false },
  { code: 'ko', name: 'Korean', native: '한국어', flag: '🇰🇷', rtl: false },
  { code: 'ru', name: 'Russian', native: 'Русский', flag: '🇷🇺', rtl: false },
  { code: 'ar', name: 'Arabic', native: 'العربية', flag: '🇸🇦', rtl: true },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳', rtl: false }
];

// In-memory translations storage
const translations: Record<string, Record<string, string>> = {
  en: {},
  es: {},
  pt: {},
  fr: {},
  de: {},
  it: {},
  zh: {},
  ja: {},
  ko: {},
  ru: {},
  ar: {},
  hi: {}
};

// Settings
let i18nSettings = {
  defaultLanguage: 'en',
  fallbackLanguage: 'en',
  autoDetect: true,
  enabledLanguages: ['en', 'es', 'pt', 'fr', 'de', 'it', 'zh', 'ja', 'ko', 'ru', 'ar', 'hi']
};

// GET - Fetch translations or settings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get('lang');
    const key = searchParams.get('key');
    const section = searchParams.get('section');

    if (section === 'languages') {
      return NextResponse.json({
        success: true,
        languages: SUPPORTED_LANGUAGES.filter(l => 
          i18nSettings.enabledLanguages.includes(l.code)
        )
      });
    }

    if (section === 'settings') {
      return NextResponse.json({
        success: true,
        settings: i18nSettings
      });
    }

    if (lang) {
      if (key) {
        return NextResponse.json({
          success: true,
          translation: translations[lang]?.[key] || null
        });
      }
      return NextResponse.json({
        success: true,
        translations: translations[lang] || {}
      });
    }

    return NextResponse.json({
      success: true,
      allTranslations: translations,
      settings: i18nSettings,
      languages: SUPPORTED_LANGUAGES
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

// POST - Add/update translations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lang, key, value, bulk } = body;

    if (bulk && lang) {
      translations[lang] = { ...translations[lang], ...bulk };
      return NextResponse.json({ success: true, message: 'Bulk update complete' });
    }

    if (lang && key && value) {
      if (!translations[lang]) translations[lang] = {};
      translations[lang][key] = value;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

// PUT - Update settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    i18nSettings = { ...i18nSettings, ...body };
    return NextResponse.json({ success: true, settings: i18nSettings });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// DELETE - Remove translation
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get('lang');
    const key = searchParams.get('key');

    if (lang && key && translations[lang]) {
      delete translations[lang][key];
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
