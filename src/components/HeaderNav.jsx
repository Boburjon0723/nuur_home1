import { Link, useLocation } from 'react-router-dom';
import { categoryLabel } from '../api/catalog';
import { useLanguage } from '../contexts/LanguageContext';
import { trackEvent } from '../lib/analytics';

const SITE_NAME = import.meta.env.VITE_SITE_NAME || '';

const LANGS = [
  { code: 'uz', labelKey: 'langUz' },
  { code: 'ru', labelKey: 'langRu' },
  { code: 'en', labelKey: 'langEn' },
];

export default function HeaderNav({ categories = [], activeCategoryId = null }) {
  const { pathname } = useLocation();
  const { language, setLanguage, t } = useLanguage();
  const isCatalog = pathname === '/' || pathname === '';
  const isAlbum = pathname === '/album';

  const displayTitle = SITE_NAME.trim() || t('defaultSiteName');

  const navBtn =
    'rounded-full px-4 py-2 text-sm font-semibold transition whitespace-nowrap';
  const active = 'bg-brand text-white shadow-sm';
  const inactive = 'bg-stone-100 text-stone-700 hover:bg-stone-200';

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-3 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/" className="text-lg font-bold text-brand md:text-xl">
            {displayTitle}
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <nav className="flex items-center gap-2">
              <Link
                to="/"
                className={`${navBtn} ${isCatalog ? active : inactive}`}
              >
                {t('navCatalog')}
              </Link>
              <Link
                to="/album"
                className={`${navBtn} ${isAlbum ? active : inactive}`}
              >
                {t('navAlbum')}
              </Link>
            </nav>
            <div className="flex items-center rounded-full border border-stone-200 bg-white px-1 py-0.5 text-xs font-semibold text-stone-600">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="max-w-[7.5rem] cursor-pointer rounded-full bg-transparent py-1.5 pl-2 pr-2 outline-none hover:text-brand sm:max-w-none sm:pr-3"
                aria-label="Language"
              >
                {LANGS.map(({ code, labelKey }) => (
                  <option key={code} value={code}>
                    {t(labelKey)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {categories.length > 0 && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Link
              to="/"
              className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                activeCategoryId == null
                  ? 'border-brand/40 bg-brand/10 text-brand'
                  : 'border-stone-200 bg-white text-stone-600 hover:border-brand/40 hover:text-brand'
              }`}
              aria-current={activeCategoryId == null ? 'true' : undefined}
            >
              {t('filterAll')}
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/#cat-${cat.id}`}
                onClick={() =>
                  trackEvent('category_click', {
                    categoryId: cat.id,
                    source: 'header',
                  })
                }
                className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                  activeCategoryId === cat.id
                    ? 'border-brand/40 bg-brand/10 text-brand'
                    : 'border-stone-200 bg-white text-stone-600 hover:border-brand/40 hover:text-brand'
                }`}
                aria-current={activeCategoryId === cat.id ? 'true' : undefined}
              >
                {categoryLabel(cat, language) || cat.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
