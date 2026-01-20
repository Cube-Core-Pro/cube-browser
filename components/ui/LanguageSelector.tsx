'use client';

import React from 'react';
import { useI18n, Locale } from '../providers/I18nProvider';
import { Globe } from 'lucide-react';
import './LanguageSelector.css';

interface LanguageSelectorProps {
  variant?: 'dropdown' | 'list' | 'compact';
  showFlag?: boolean;
  className?: string;
}

const localeFlags: Record<Locale, string> = {
  en: '🇺🇸',
  es: '🇪🇸',
  pt: '🇧🇷',
  it: '🇮🇹',
  de: '🇩🇪',
  fr: '🇫🇷',
  tr: '🇹🇷',
  zh: '🇨🇳',
  ja: '🇯🇵',
  ko: '🇰🇷',
  ar: '🇸🇦',
  ru: '🇷🇺',
};

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'dropdown',
  showFlag = true,
  className = '',
}) => {
  const { locale, setLocale, localeNames, availableLocales, t } = useI18n();
  const [isOpen, setIsOpen] = React.useState(false);

  const handleSelect = (newLocale: Locale) => {
    setLocale(newLocale);
    setIsOpen(false);
  };

  if (variant === 'list') {
    return (
      <div className={`language-list ${className}`}>
        <div className="language-list-header">
          <Globe size={18} />
          <span>{t('settings.language')}</span>
        </div>
        <div className="language-list-items">
          {availableLocales.map((loc) => (
            <button
              key={loc}
              className={`language-item ${loc === locale ? 'active' : ''}`}
              onClick={() => handleSelect(loc)}
              aria-label={`Select ${localeNames[loc]}`}
            >
              {showFlag && <span className="language-flag">{localeFlags[loc]}</span>}
              <span className="language-name">{localeNames[loc]}</span>
              {loc === locale && <span className="language-check">✓</span>}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <select
        value={locale}
        onChange={(e) => handleSelect(e.target.value as Locale)}
        className={`language-select-compact ${className}`}
        aria-label={t('settings.language')}
        title={t('settings.language')}
      >
        {availableLocales.map((loc) => (
          <option key={loc} value={loc}>
            {showFlag ? `${localeFlags[loc]} ` : ''}{localeNames[loc]}
          </option>
        ))}
      </select>
    );
  }

  // Default: dropdown
  return (
    <div className={`language-dropdown ${className}`}>
      <button
        className="language-dropdown-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={t('settings.language')}
      >
        {showFlag && <span className="language-flag">{localeFlags[locale]}</span>}
        <span className="language-current">{localeNames[locale]}</span>
        <Globe size={16} className="language-icon" />
      </button>

      {isOpen && (
        <>
          <div 
            className="language-dropdown-backdrop" 
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="language-dropdown-menu" role="listbox">
            {availableLocales.map((loc) => (
              <button
                key={loc}
                className={`language-dropdown-item ${loc === locale ? 'active' : ''}`}
                onClick={() => handleSelect(loc)}
                role="option"
                aria-selected={loc === locale}
              >
                {showFlag && <span className="language-flag">{localeFlags[loc]}</span>}
                <span className="language-name">{localeNames[loc]}</span>
                {loc === locale && <span className="language-check">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSelector;
