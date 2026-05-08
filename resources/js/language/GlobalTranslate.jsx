import React, { createContext, useContext, useState } from 'react';
import { English } from './English';
import { Bangla } from './Bangla';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('ENG');

  const translations = language === 'ENG' ? English : Bangla;

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'ENG' ? 'BAN' : 'ENG'));
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
