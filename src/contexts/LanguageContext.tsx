import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import uzLatTranslations from '@/locales/uz-lat.json';
import uzTranslations from '@/locales/uz.json';
import ruTranslations from '@/locales/ru.json';

type Language = 'uz-lat' | 'uz' | 'ru';

interface Translations {
  [key: string]: any;
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  questionLang: 'oz' | 'uz' | 'ru';
}

const translations: Record<Language, Translations> = {
  'uz-lat': uzLatTranslations,
  uz: uzTranslations,
  ru: ruTranslations,
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('language');
      return (saved === 'uz-lat' || saved === 'uz' || saved === 'ru') ? saved : 'uz-lat';
    } catch {
      return 'uz-lat';
    }
  });

  useEffect(() => {
    try { localStorage.setItem('language', language); } catch { /* ignore quota/security errors */ }
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
  }, []);

  const t = useCallback((key: string): string => {
    const keys = key.split('.');
    let result: any = translations[language];
    
    for (const k of keys) {
      if (result && typeof result === 'object' && k in result) {
        result = result[k];
      } else {
        return key;
      }
    }
    
    return typeof result === 'string' ? result : key;
  }, [language]);

  const questionLang: 'oz' | 'uz' | 'ru' = useMemo(
    () => language === 'uz-lat' ? 'oz' : language,
    [language]
  );

  const value = useMemo(
    () => ({ language, setLanguage, t, questionLang }),
    [language, setLanguage, t, questionLang]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
