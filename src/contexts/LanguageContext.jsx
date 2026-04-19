import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { STRINGS } from '../i18n/strings';

const LanguageContext = createContext(null);

function normalizeLang(code) {
  const c = String(code || '').toLowerCase();
  if (c === 'ru' || c === 'en') return c;
  return 'uz';
}

function readInitialLang() {
  try {
    const s = localStorage.getItem('catalog-vitrina-lang');
    if (s === 'uz' || s === 'ru' || s === 'en') return s;
  } catch {
    /* ignore */
  }
  const env = (import.meta.env.VITE_CATALOG_LANG || 'uz').toLowerCase();
  return normalizeLang(env);
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(readInitialLang);

  const setLanguage = useCallback((code) => {
    const L = normalizeLang(code);
    setLanguageState(L);
    try {
      localStorage.setItem('catalog-vitrina-lang', L);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback(
    (key) => STRINGS[language]?.[key] ?? STRINGS.uz[key] ?? key,
    [language]
  );

  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage faqat LanguageProvider ichida');
  }
  return ctx;
}
