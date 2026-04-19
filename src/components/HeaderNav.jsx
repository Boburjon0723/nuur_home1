import { Link, useLocation, useNavigate } from 'react-router-dom';
import { categoryLabel } from '../api/catalog';
import { useLanguage } from '../contexts/LanguageContext';
import { trackEvent } from '../lib/analytics';

const SITE_NAME = import.meta.env.VITE_SITE_NAME || '';

const LANGS = [
  { code: 'uz', labelKey: 'langUz' },
  { code: 'ru', labelKey: 'langRu' },
  { code: 'en', labelKey: 'langEn' },
];

function scrollToCategorySection(catId) {
  if (catId == null) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  const id = catId === 'new' || catId === '__new__' ? 'cat-new' : `cat-${catId}`;
  const run = () =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  run();
  requestAnimationFrame(run);
  setTimeout(run, 80);
  setTimeout(run, 320);
}

export default function HeaderNav({ categories = [], activeCategoryId = null }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { language, setLanguage, t } = useLanguage();
  const isAlbum = pathname === '/' || pathname === '';
  const isCatalog = pathname === '/catalog' || pathname.startsWith('/catalog/');

  const displayTitle = SITE_NAME.trim() || t('defaultSiteName');

  return (
    <header className="sticky top-0 z-30 border-b border-surface-200/40 bg-white/60 shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto max-w-7xl px-4 py-3 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/"
            className="text-xl font-extrabold tracking-tight text-brand transition-colors duration-300 hover:text-brand-accent md:text-2xl"
          >
            {displayTitle}
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <nav className="flex items-center gap-2">
              <Link
                to="/catalog"
                className={`nav-pill ${isCatalog ? 'nav-pill-active' : 'nav-pill-idle'}`}
              >
                {t('navCatalog')}
              </Link>
              <Link
                to="/"
                className={`nav-pill ${isAlbum ? 'nav-pill-active' : 'nav-pill-idle'}`}
              >
                {t('navAlbum')}
              </Link>
            </nav>
            <div className="flex items-center rounded-full border border-stone-200/90 bg-white px-1 py-0.5 text-xs font-semibold text-stone-600 shadow-sm">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="max-w-[7.5rem] cursor-pointer rounded-full bg-transparent py-1.5 pl-2 pr-2 outline-none transition hover:text-brand focus-visible:ring-2 focus-visible:ring-brand/30 sm:max-w-none sm:pr-3"
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

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Link
            to="/catalog"
            onClick={(e) => {
              e.preventDefault();
              navigate({ pathname: '/catalog', search: '', hash: '' }, { replace: false });
              scrollToCategorySection(null);
            }}
            className={`chip ${
              activeCategoryId == null && isCatalog ? 'chip-active' : 'chip-idle'
            }`}
            aria-current={activeCategoryId == null && isCatalog ? 'true' : undefined}
          >
            {t('filterAll')}
          </Link>
          <Link
            to="/catalog#cat-new"
            onClick={(e) => {
              e.preventDefault();
              navigate(
                { pathname: '/catalog', search: '', hash: 'cat-new' },
                { replace: false }
              );
              trackEvent('category_click', { categoryId: 'new', source: 'header' });
              scrollToCategorySection('new');
            }}
            className={`chip font-semibold ${
              activeCategoryId === '__new__' ? 'chip-active' : 'chip-idle'
            }`}
            aria-current={activeCategoryId === '__new__' ? 'true' : undefined}
          >
            {t('categoryNew')}
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/catalog#cat-${cat.id}`}
              onClick={(e) => {
                e.preventDefault();
                navigate(
                  { pathname: '/catalog', search: '', hash: `cat-${cat.id}` },
                  { replace: false }
                );
                trackEvent('category_click', {
                  categoryId: cat.id,
                  source: 'header',
                });
                scrollToCategorySection(cat.id);
              }}
              className={`chip ${
                activeCategoryId === cat.id ? 'chip-active' : 'chip-idle'
              }`}
              aria-current={activeCategoryId === cat.id ? 'true' : undefined}
            >
              {categoryLabel(cat, language) || cat.name}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
