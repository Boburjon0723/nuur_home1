import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import HeaderNav from './components/HeaderNav';
import { fetchCategories } from './api/catalog';
import { useLanguage } from './contexts/LanguageContext';

const SITE_NAME = import.meta.env.VITE_SITE_NAME || '';

export default function Shell() {
  const [categories, setCategories] = useState([]);
  const [activeCategoryId, setActiveCategoryId] = useState(null);
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
      <HeaderNav
        categories={categories}
        activeCategoryId={activeCategoryId}
      />
      <Outlet
        context={{ categories, activeCategoryId, setActiveCategoryId }}
      />
      <footer className="mt-auto border-t border-stone-200/80 bg-white/60 py-8 text-center text-sm text-stone-500 backdrop-blur-sm">
        <p className="mx-auto max-w-2xl leading-relaxed">
          <span className="font-semibold text-stone-700">{displayTitle}</span>{' '}
          <span className="text-stone-500">{t('footerNote')}</span>
        </p>
      </footer>
    </div>
  );
}
