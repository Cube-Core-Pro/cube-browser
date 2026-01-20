'use client';

import { useCallback, useMemo } from 'react';

// Import locale files
import en from '@/locales/en.json';
import es from '@/locales/es.json';
import de from '@/locales/de.json';
import fr from '@/locales/fr.json';
import it from '@/locales/it.json';
import pt from '@/locales/pt.json';
import ja from '@/locales/ja.json';
import ko from '@/locales/ko.json';
import zh from '@/locales/zh.json';
import ru from '@/locales/ru.json';
import ar from '@/locales/ar.json';
import tr from '@/locales/tr.json';

/**
 * Available locales in the application
 */
export type Locale = 'en' | 'es' | 'de' | 'fr' | 'it' | 'pt' | 'ja' | 'ko' | 'zh' | 'ru' | 'ar' | 'tr';

/**
 * Locale metadata for display
 */
export interface LocaleInfo {
  code: Locale;
  name: string;
  nativeName: string;
  dir: 'ltr' | 'rtl';
}

/**
 * Available locales with metadata
 */
export const AVAILABLE_LOCALES: LocaleInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', dir: 'ltr' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', dir: 'ltr' },
  { code: 'fr', name: 'French', nativeName: 'Français', dir: 'ltr' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', dir: 'ltr' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', dir: 'ltr' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', dir: 'ltr' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', dir: 'ltr' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', dir: 'ltr' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', dir: 'ltr' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', dir: 'ltr' },
];

/**
 * Locale dictionary type
 */
type LocaleDictionary = Record<string, unknown>;

/**
 * All locale dictionaries
 */
const locales: Record<Locale, LocaleDictionary> = {
  en,
  es,
  de,
  fr,
  it,
  pt,
  ja,
  ko,
  zh,
  ru,
  ar,
  tr,
};

/**
 * Get the current locale from browser or localStorage
 */
const getCurrentLocale = (): Locale => {
  // Check localStorage first
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('cube-locale');
    if (stored && stored in locales) {
      return stored as Locale;
    }
    
    // Fallback to browser language
    const browserLang = navigator.language.split('-')[0];
    if (browserLang in locales) {
      return browserLang as Locale;
    }
  }
  
  return 'en';
};

/**
 * Get nested value from object using dot notation
 * @param obj - Object to get value from
 * @param path - Dot-separated path to value
 * @returns Value at path or undefined
 */
const getNestedValue = (obj: LocaleDictionary, path: string): string | undefined => {
  const keys = path.split('.');
  let current: unknown = obj;
  
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }
  
  return typeof current === 'string' ? current : undefined;
};

/**
 * Replace placeholders in a string with values
 * Supports {key} syntax for simple replacements
 * @param str - String with placeholders
 * @param params - Object with replacement values
 * @returns String with placeholders replaced
 */
const interpolate = (str: string, params?: Record<string, string | number>): string => {
  if (!params) return str;
  
  return str.replace(/\{(\w+)\}/g, (match, key) => {
    return key in params ? String(params[key]) : match;
  });
};

/**
 * Translation function type
 */
export type TranslateFunction = (
  key: string,
  defaultValue?: string,
  params?: Record<string, string | number>
) => string;

/**
 * useTranslation hook return type
 */
export interface UseTranslationReturn {
  /** Translate a key to current locale */
  t: TranslateFunction;
  /** Current locale code */
  locale: Locale;
  /** Change current locale */
  setLocale: (locale: Locale) => void;
  /** Current locale info */
  localeInfo: LocaleInfo;
  /** All available locales */
  availableLocales: LocaleInfo[];
  /** Check if current locale is RTL */
  isRtl: boolean;
}

/**
 * M5 Translation Hook
 * 
 * Provides internationalization support with:
 * - Automatic locale detection from browser/localStorage
 * - Dot notation key access (e.g., 'common.save')
 * - Fallback to default value or key
 * - Parameter interpolation
 * - RTL support
 * 
 * @example
 * ```tsx
 * const { t, locale, setLocale } = useTranslation();
 * 
 * // Simple translation
 * <span>{t('common.save')}</span>
 * 
 * // With default fallback
 * <span>{t('custom.key', 'Default Text')}</span>
 * 
 * // With parameters
 * <span>{t('greeting', 'Hello {name}', { name: 'User' })}</span>
 * ```
 */
export function useTranslation(): UseTranslationReturn {
  const locale = useMemo(() => getCurrentLocale(), []);
  
  const localeInfo = useMemo(() => {
    return AVAILABLE_LOCALES.find(l => l.code === locale) || AVAILABLE_LOCALES[0];
  }, [locale]);
  
  const isRtl = useMemo(() => localeInfo.dir === 'rtl', [localeInfo]);
  
  const setLocale = useCallback((newLocale: Locale) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cube-locale', newLocale);
      // Trigger page reload to apply new locale
      window.location.reload();
    }
  }, []);
  
  const t: TranslateFunction = useCallback((
    key: string,
    defaultValue?: string,
    params?: Record<string, string | number>
  ): string => {
    // Try current locale first
    let value = getNestedValue(locales[locale], key);
    
    // Fallback to English if not found
    if (value === undefined && locale !== 'en') {
      value = getNestedValue(locales.en, key);
    }
    
    // Use default value or key as last resort
    const result = value ?? defaultValue ?? key;
    
    // Interpolate parameters
    return interpolate(result, params);
  }, [locale]);
  
  return {
    t,
    locale,
    setLocale,
    localeInfo,
    availableLocales: AVAILABLE_LOCALES,
    isRtl,
  };
}

/**
 * Server-side translation function
 * Use when you need translations outside of React components
 * @param locale - Locale to use for translation
 */
export function createServerTranslation(locale: Locale = 'en'): TranslateFunction {
  return (key: string, defaultValue?: string, params?: Record<string, string | number>): string => {
    let value = getNestedValue(locales[locale], key);
    
    if (value === undefined && locale !== 'en') {
      value = getNestedValue(locales.en, key);
    }
    
    const result = value ?? defaultValue ?? key;
    return interpolate(result, params);
  };
}

export default useTranslation;
