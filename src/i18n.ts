import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslation from './locales/en.json';
import itTranslation from './locales/it.json';
import frTranslation from './locales/fr.json';
import arTranslation from './locales/ar.json';
import esTranslation from './locales/es.json';

const resources = {
  en: { translation: enTranslation },
  it: { translation: itTranslation },
  fr: { translation: frTranslation },
  ar: { translation: arTranslation },
  es: { translation: esTranslation }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'it', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
