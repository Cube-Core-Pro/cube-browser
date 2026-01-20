/**
 * CUBE Nexum - i18n System
 * Index file that combines all translations and provides hooks
 * 
 * Supports 12+ languages with:
 * - Automatic browser language detection
 * - RTL support for Arabic
 * - Persistent language preferences
 */

import { en, es, pt } from './translations-group1';
import { fr, de, it } from './translations-group2';
import { zh, ja, ko } from './translations-group3';
import { ru, ar, hi } from './translations-group4';

// All translations combined
export const translations: Record<string, Record<string, string>> = {
  en, es, pt, fr, de, it, zh, ja, ko, ru, ar, hi
};

// Supported languages with metadata (includes auto-detect option)
export const languages = [
  { code: 'auto', name: 'Automatic', native: 'Auto', flag: '🌐', rtl: false },
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
] as const;

// Storage key for persisting language preference
const STORAGE_KEY = 'cube_language';

export type LanguageCode = typeof languages[number]['code'];
export type ActualLanguageCode = Exclude<LanguageCode, 'auto'>;
export type TranslationKey = keyof typeof en;

// Get translation with fallback to English
export function t(key: string, lang: string = 'en'): string {
  // Resolve 'auto' to detected language
  const effectiveLang = lang === 'auto' ? detectLanguage() : lang;
  return translations[effectiveLang]?.[key] || translations['en']?.[key] || key;
}

// Detect browser language (never returns 'auto')
export function detectLanguage(): ActualLanguageCode {
  if (typeof window === 'undefined') return 'en';
  
  const browserLang = navigator.language.split('-')[0];
  const supported = languages.find(l => l.code === browserLang && l.code !== 'auto');
  return supported ? supported.code as ActualLanguageCode : 'en';
}

// Get saved language preference
export function getSavedLanguage(): LanguageCode {
  if (typeof window === 'undefined') return 'auto';
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && languages.some(l => l.code === saved)) {
    return saved as LanguageCode;
  }
  return 'auto';
}

// Save language preference
export function saveLanguage(code: LanguageCode): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, code);
  }
}

// Get effective language (resolves 'auto' to actual language)
export function getEffectiveLanguage(code: LanguageCode = getSavedLanguage()): ActualLanguageCode {
  return code === 'auto' ? detectLanguage() : code as ActualLanguageCode;
}

// Get language info
export function getLanguageInfo(code: string) {
  return languages.find(l => l.code === code) || languages[0];
}

// Check if RTL
export function isRTL(code: string): boolean {
  const lang = languages.find(l => l.code === code);
  return lang?.rtl || false;
}

export { en, es, pt, fr, de, it, zh, ja, ko, ru, ar, hi };
