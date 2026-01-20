'use client';

/**
 * CUBE Nexum - useTranslation Hook
 * React hook for internationalization
 */

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { translations, languages, detectLanguage, isRTL, type LanguageCode } from './index';

interface I18nContextType {
  lang: LanguageCode;
  setLang: (lang: LanguageCode) => void;
  t: (key: string, params?: Record<string, string>) => string;
  languages: typeof languages;
  isRTL: boolean;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<LanguageCode>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('cube-lang') as LanguageCode;
    if (stored && translations[stored]) {
      setLangState(stored);
    } else {
      const detected = detectLanguage();
      setLangState(detected);
    }
  }, []);

  const setLang = useCallback((newLang: LanguageCode) => {
    setLangState(newLang);
    localStorage.setItem('cube-lang', newLang);
    document.documentElement.lang = newLang;
    document.documentElement.dir = isRTL(newLang) ? 'rtl' : 'ltr';
  }, []);

  const t = useCallback((key: string, params?: Record<string, string>): string => {
    let text = translations[lang]?.[key] || translations['en']?.[key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(new RegExp(`{{${k}}}`, 'g'), v);
      });
    }
    return text;
  }, [lang]);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <I18nContext.Provider value={{ lang, setLang, t, languages, isRTL: isRTL(lang) }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    return {
      lang: 'en' as LanguageCode,
      setLang: () => {},
      t: (key: string) => key,
      languages,
      isRTL: false
    };
  }
  return context;
}
