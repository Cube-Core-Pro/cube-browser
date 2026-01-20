'use client';
import { logger } from '@/lib/services/logger-service';

const log = logger.scope('I18nProvider');

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export const locales = ['en', 'es', 'pt', 'it', 'de', 'fr', 'tr', 'zh', 'ja', 'ko', 'ar', 'ru'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  pt: 'Português',
  it: 'Italiano',
  de: 'Deutsch',
  fr: 'Français',
  tr: 'Türkçe',
  zh: '中文',
  ja: '日本語',
  ko: '한국어',
  ar: 'العربية',
  ru: 'Русский',
};

// RTL languages
export const rtlLocales: Locale[] = ['ar'];

export function isRtlLocale(locale: Locale): boolean {
  return rtlLocales.includes(locale);
}

type Messages = Record<string, Record<string, string | Record<string, string>>>;

interface I18nContextType {
  locale: Locale;
  messages: Messages;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  isRtl: boolean;
  localeNames: Record<Locale, string>;
  availableLocales: readonly Locale[];
}

const I18nContext = createContext<I18nContextType | null>(null);

interface I18nProviderProps {
  children: ReactNode;
  initialLocale?: Locale;
}

export function I18nProvider({ children, initialLocale }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale || defaultLocale);
  const [messages, setMessages] = useState<Messages>({});
  const [_isLoading, setIsLoading] = useState(true);

  // Load messages for the current locale
  const loadMessages = useCallback(async (loc: Locale) => {
    try {
      const msgs = await import(`../../locales/${loc}.json`);
      setMessages(msgs.default as unknown as Messages);
    } catch (error) {
      log.error(`Failed to load messages for locale: ${loc}`, error);
      // Fallback to English
      if (loc !== 'en') {
        try {
          const fallback = await import('../../locales/en.json');
          setMessages(fallback.default as unknown as Messages);
        } catch {
          setMessages({});
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load messages on mount and locale change
  useEffect(() => {
    loadMessages(locale);
  }, [locale, loadMessages]);

  // Persist locale preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cube-locale', locale);
      document.documentElement.lang = locale;
      document.documentElement.dir = isRtlLocale(locale) ? 'rtl' : 'ltr';
    }
  }, [locale]);

  // Load saved locale on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cube-locale') as Locale | null;
      if (saved && locales.includes(saved)) {
        setLocaleState(saved);
      } else {
        // Try to detect browser language
        const browserLang = navigator.language.split('-')[0] as Locale;
        if (locales.includes(browserLang)) {
          setLocaleState(browserLang);
        }
      }
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    if (locales.includes(newLocale)) {
      setIsLoading(true);
      setLocaleState(newLocale);
    }
  }, []);

  // Translation function with nested key support and parameter interpolation
  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const keys = key.split('.');
      let value: unknown = messages;

      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = (value as Record<string, unknown>)[k];
        } else {
          // Key not found, return the key itself
          return key;
        }
      }

      if (typeof value !== 'string') {
        return key;
      }

      // Parameter interpolation
      if (params) {
        return value.replace(/\{(\w+)\}/g, (_, paramKey) => {
          return params[paramKey]?.toString() || `{${paramKey}}`;
        });
      }

      return value;
    },
    [messages]
  );

  const contextValue: I18nContextType = {
    locale,
    messages,
    setLocale,
    t,
    isRtl: isRtlLocale(locale),
    localeNames,
    availableLocales: locales,
  };

  // Always render children - show content even while loading translations
  // The t() function will return the key if translation is not found yet
  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

export function useTranslations(namespace?: string) {
  const { t, locale, isRtl } = useI18n();
  
  const scopedT = useCallback(
    (key: string, fallbackOrParams?: string | Record<string, string | number>) => {
      const fullKey = namespace ? `${namespace}.${key}` : key;
      
      // If second arg is a string, treat it as fallback
      if (typeof fallbackOrParams === 'string') {
        const result = t(fullKey);
        // If t() returns the key itself (not found), use fallback
        return result === fullKey ? fallbackOrParams : result;
      }
      
      // Otherwise treat as params
      return t(fullKey, fallbackOrParams);
    },
    [t, namespace]
  );

  return { t: scopedT, locale, isRtl };
}
