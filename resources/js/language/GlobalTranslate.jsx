import React, { createContext, useContext, useState } from 'react';
import { English } from './English';
import { Bangla } from './Bangla';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(localStorage.getItem('app_lang') || 'ENG');

  const translations = language === 'ENG' ? English : Bangla;

  const toggleLanguage = () => {
    const next = language === 'ENG' ? 'BAN' : 'ENG';
    setLanguage(next);
    localStorage.setItem('app_lang', next);
  };

  return (
    <LanguageContext.Provider value={{ language, translations, toggleLanguage }}>
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
