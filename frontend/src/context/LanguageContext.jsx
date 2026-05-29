import { createContext, useContext, useState } from 'react';
import { translations } from '../i18n/translations';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
    const [language, setLanguage] = useState(
        () => localStorage.getItem('patient_language') || 'en'
    );

    function changeLanguage(lang) {
        setLanguage(lang);
        localStorage.setItem('patient_language', lang);
    }

    function t(key) {
        return translations[language]?.[key]
            || translations['en']?.[key]
            || key;
    }

    return (
        <LanguageContext.Provider value={{ language, changeLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

// Safe hook — returns English fallback when used outside LanguageProvider
// (e.g. Doctor / Caretaker portal sidebar)
export function useLanguage() {
    const ctx = useContext(LanguageContext);
    if (!ctx) {
        return {
            language: 'en',
            changeLanguage: () => { },
            t: (key) => translations['en']?.[key] || key,
        };
    }
    return ctx;
}
