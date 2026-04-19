import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import HeaderNav from './components/HeaderNav';
import { fetchCategories } from './api/catalog';
import { useLanguage } from './contexts/LanguageContext';

const SITE_NAME = import.meta.env.VITE_SITE_NAME || '';

export default function Shell() {
  const [categories, setCategories] = useState([]);
  const { t } = useLanguage();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cats = await fetchCategories();
        if (!cancelled) setCategories(cats);
      } catch {
        if (!cancelled) setCategories([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const displayTitle = SITE_NAME.trim() || t('defaultSiteName');

  return (
    <div className="flex min-h-screen flex-col">
      <HeaderNav categories={categories} />
      <Outlet context={{ categories }} />
      <footer className="mt-auto border-t border-stone-200 py-8 text-center text-sm text-stone-500">
        <p>
          {displayTitle} {t('footerNote')}
        </p>
      </footer>
    </div>
  );
}
