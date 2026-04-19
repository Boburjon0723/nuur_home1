import { useEffect, useMemo, useState } from 'react';
import { Funnel, Search, SlidersHorizontal, Star, X } from 'lucide-react';
import {
  fetchActiveProducts,
  productDescription,
  productTitle,
  categoryLabel,
} from '../api/catalog';
import {
  useLocation,
  useNavigate,
  useOutletContext,
  useSearchParams,
} from 'react-router-dom';
import CategorySection from '../components/CategorySection';
import ProductDetailPanel from '../components/ProductDetailPanel';
import { useLanguage } from '../contexts/LanguageContext';
import { trackEvent } from '../lib/analytics';

const FAVORITES_KEY = 'catalog-vitrina-favorites';
const CATALOG_PATH = '/catalog';

function productIdsMatch(storedId, queryId) {
  const a = String(storedId ?? '').trim();
  const b = String(queryId ?? '').trim();
  if (!a || !b) return false;
  if (a === b) return true;
  const norm = (s) => s.toLowerCase().replace(/-/g, '');
  return norm(a) === norm(b);
}

function scrollToCategorySection(catId) {
  if (catId == null) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  const id = `cat-${catId}`;
  const run = () =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  run();
  requestAnimationFrame(run);
  setTimeout(run, 80);
  setTimeout(run, 320);
}

function parseFetchError(e) {
  const msg = e?.message || '';
  if (msg === 'ENV_MISSING') return { kind: 'env' };
  if (
    msg.includes('Failed to fetch') ||
    msg === 'TypeError: Failed to fetch'
  ) {
    return { kind: 'network' };
  }
  return { kind: 'raw', message: msg || '' };
}

export default function CatalogPage() {
  const {
    categories = [],
    activeCategoryId,
    setActiveCategoryId,
  } = useOutletContext() || {};
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, language } = useLanguage();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchErr, setFetchErr] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [favorites, setFavorites] = useState([]);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [desktopFiltersOpen, setDesktopFiltersOpen] = useState(true);
  const [viewedProductIds, setViewedProductIds] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) setFavorites(parsed);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    } catch {
      /* ignore */
    }
  }, [favorites]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setFetchErr(null);
      try {
        const prods = await fetchActiveProducts();
        if (!cancelled) setProducts(prods);
      } catch (e) {
        if (!cancelled) setFetchErr(parseFetchError(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const errMessage = useMemo(() => {
    if (!fetchErr) return '';
    if (fetchErr.kind === 'env') return t('errEnv');
    if (fetchErr.kind === 'network') return t('errNetwork');
    return fetchErr.message || t('errGeneric');
  }, [fetchErr, t]);

  useEffect(() => {
    if (loading || fetchErr) return;
    const hash = location.hash?.replace(/^#/, '');
    if (hash === 'cat-new') {
      setActiveCategoryId?.('__new__');
    }
    if (!hash || !hash.startsWith('cat-')) return;
    const el = document.getElementById(hash);
    if (el) {
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, [loading, fetchErr, location.hash, products, setActiveCategoryId]);

  useEffect(() => {
    if (loading || products.length === 0) return;
    const pid = searchParams.get('product')?.trim() ?? '';
    if (!pid) {
      setSelectedProduct(null);
      return;
    }
    const found = products.find((p) => productIdsMatch(p.id, pid));
    if (found) {
      setSelectedProduct((prev) =>
        productIdsMatch(prev?.id, found.id) ? prev : found
      );
    } else {
      setSelectedProduct(null);
    }
  }, [loading, products, searchParams]);

  useEffect(() => {
    if (!selectedProduct) return;
    const cur = searchParams.get('product')?.trim() ?? '';
    if (productIdsMatch(cur, selectedProduct.id)) return;
    const next = new URLSearchParams(searchParams);
    next.set('product', String(selectedProduct.id));
    setSearchParams(next, { replace: true });
  }, [selectedProduct, searchParams, setSearchParams]);

  const visibleProducts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    let list = [...products];
    if (favoritesOnly) {
      list = list.filter((p) => favorites.includes(p.id));
    }
    if (q) {
      list = list.filter((p) => {
        const title = productTitle(p, language).toLowerCase();
        const desc = productDescription(p, language).toLowerCase();
        return title.includes(q) || desc.includes(q);
      });
    }
    list.sort((a, b) => {
      if (sortBy === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortBy === 'az') {
        return productTitle(a, language).localeCompare(productTitle(b, language));
      }
      if (sortBy === 'za') {
        return productTitle(b, language).localeCompare(productTitle(a, language));
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return list;
  }, [favorites, favoritesOnly, products, searchTerm, sortBy, language]);

  const sections = useMemo(() => {
    const byCatId = new Map();
    categories.forEach((c) => byCatId.set(c.id, { category: c, products: [] }));

    const uncategorized = [];

    for (const p of visibleProducts) {
      const cid = p.category_id;
      if (cid && byCatId.has(cid)) {
        byCatId.get(cid).products.push(p);
      } else {
        uncategorized.push(p);
      }
    }

    const ordered = categories
      .map((c) => byCatId.get(c.id))
      .filter((s) => s && s.products.length > 0);

    const newProducts = visibleProducts.filter((p) => p.show_in_new === true);

    return { ordered, uncategorized, newProducts };
  }, [categories, visibleProducts]);

  useEffect(() => {
    if (loading || fetchErr) return;
    const ids = categories.map((c) => `cat-${c.id}`);
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length === 0) return;
        const id = visible[0].target.id.replace('cat-', '');
        const asNum = Number(id);
        setActiveCategoryId?.(Number.isNaN(asNum) ? id : asNum);
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: [0.2, 0.4, 0.6] }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [categories, fetchErr, loading, sections.ordered, setActiveCategoryId]);

  const relatedProducts = useMemo(() => {
    if (!selectedProduct) return [];
    const seenOrder = new Map(viewedProductIds.map((id, index) => [id, index]));
    return visibleProducts
      .filter(
        (p) =>
          p.id !== selectedProduct.id &&
          p.category_id === selectedProduct.category_id
      )
      .sort((a, b) => {
        const aSeen = seenOrder.has(a.id);
        const bSeen = seenOrder.has(b.id);
        if (aSeen && !bSeen) return 1;
        if (!aSeen && bSeen) return -1;
        if (aSeen && bSeen) {
          return (seenOrder.get(a.id) ?? 0) - (seenOrder.get(b.id) ?? 0);
        }
        return 0;
      });
  }, [selectedProduct, visibleProducts, viewedProductIds]);

  function handleSelectProduct(product) {
    setSelectedProduct(product);
    setViewedProductIds((prev) => {
      const next = prev.filter((id) => id !== product.id);
      next.push(product.id);
      return next;
    });
    trackEvent('product_view', { productId: product.id, categoryId: product.category_id });
  }

  function handleClosePanel() {
    setSelectedProduct(null);
    const next = new URLSearchParams(searchParams);
    next.delete('product');
    setSearchParams(next, { replace: true });
  }

  function handleToggleFavorite(productId) {
    setFavorites((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  }

  function handleSelectCategory(categoryId) {
    if (categoryId === '__new__') {
      navigate(
        { pathname: CATALOG_PATH, search: '', hash: 'cat-new' },
        { replace: false }
      );
      scrollToCategorySection('new');
      setActiveCategoryId?.('__new__');
    } else if (categoryId == null) {
      navigate({ pathname: CATALOG_PATH, search: '', hash: '' }, { replace: false });
      scrollToCategorySection(null);
      setActiveCategoryId?.(null);
    } else {
      navigate(
        { pathname: CATALOG_PATH, search: '', hash: `cat-${categoryId}` },
        { replace: false }
      );
      scrollToCategorySection(categoryId);
    }
    setMobileFiltersOpen(false);
  }

  return (
    <div
      className={`transition-all duration-300 ${
        selectedProduct ? 'pr-0 sm:pr-[32rem] md:pr-[36rem] lg:pr-[42rem]' : ''
      }`}
    >
      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-3 py-8 sm:px-4 sm:py-10 md:px-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside
          className={`hidden self-start rounded-[1.25rem] border border-surface-200/50 bg-white/70 p-5 shadow-card backdrop-blur-md lg:sticky lg:top-24 lg:block ${
            desktopFiltersOpen ? '' : 'h-fit'
          }`}
        >
          <button
            type="button"
            className="mb-5 inline-flex w-full items-center justify-center gap-2.5 rounded-xl border border-surface-200/80 bg-surface-50/50 px-4 py-2.5 text-sm font-semibold text-brand transition-all hover:bg-surface-100/80 active:scale-95"
            onClick={() => setDesktopFiltersOpen((v) => !v)}
            aria-expanded={desktopFiltersOpen}
          >
            <SlidersHorizontal className="h-4 w-4 text-brand-accent" />
            {t('filterTitle')}
          </button>
          {desktopFiltersOpen && (
            <div className="space-y-4 lg:max-h-[calc(100vh-8.5rem)] lg:overflow-auto lg:pr-1">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-surface-400" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="filter-input !py-3 !pl-10"
                  placeholder={t('searchPlaceholder')}
                  aria-label={t('searchPlaceholder')}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-surface-500">
                  {t('sortLabel')}
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="filter-input cursor-pointer"
                >
                  <option value="newest">{t('sortNewest')}</option>
                  <option value="oldest">{t('sortOldest')}</option>
                  <option value="az">{t('sortAz')}</option>
                  <option value="za">{t('sortZa')}</option>
                </select>
              </label>
              <label className="group flex cursor-pointer items-center gap-3 rounded-xl border border-surface-200/50 bg-surface-50/30 px-3.5 py-3 text-sm font-medium text-brand transition-all hover:bg-surface-100/50">
                <input
                  type="checkbox"
                  checked={favoritesOnly}
                  onChange={(e) => setFavoritesOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-surface-300 text-brand-accent focus:ring-brand-accent/30"
                />
                {t('favoritesOnly')}
              </label>
              <div className="border-t border-surface-200/50 pt-4">
                <button
                  type="button"
                  onClick={() => handleSelectCategory(null)}
                  className={`mb-2.5 w-full rounded-xl border-2 border-solid px-4 py-3 text-left text-sm transition-all duration-300 active:scale-95 ${
                    activeCategoryId == null
                      ? 'border-brand bg-brand font-bold text-white shadow-nav'
                      : 'border-surface-200/50 bg-white/70 font-medium text-surface-600 hover:border-brand-accent/50 hover:bg-white hover:text-brand-accent hover:shadow-sm'
                  }`}
                >
                  {t('filterAll')}
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectCategory('__new__')}
                  className={`mb-2.5 w-full rounded-xl border-2 border-solid px-4 py-3 text-left text-sm transition-all duration-300 active:scale-95 ${
                    activeCategoryId === '__new__'
                      ? 'border-brand bg-brand font-bold text-white shadow-nav'
                      : 'border-surface-200/50 bg-white/70 font-semibold text-brand hover:border-brand-accent/50 hover:bg-white hover:text-brand-accent hover:shadow-sm'
                  }`}
                >
                  {t('categoryNew')}
                </button>
                {categories.map((cat) => {
                  const selected =
                    activeCategoryId != null &&
                    String(activeCategoryId) === String(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleSelectCategory(cat.id)}
                      className={`mb-2.5 w-full rounded-xl border-2 border-solid px-4 py-3 text-left text-sm transition-all duration-300 active:scale-95 ${
                        selected
                          ? 'border-brand bg-brand font-bold text-white shadow-nav'
                          : 'border-surface-200/50 bg-white/70 font-medium text-surface-600 hover:border-brand-accent/50 hover:bg-white hover:text-brand-accent hover:shadow-sm'
                      }`}
                    >
                      {categoryLabel(cat, language) || cat.name || '—'}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </aside>

        <section>
          <div className="mb-4 flex items-center justify-between gap-2 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 shadow-sm transition hover:border-brand/25 hover:shadow active:scale-[0.98]"
            >
              <Funnel className="h-4 w-4 text-brand" />
              {t('openFilters')}
            </button>
            <button
              type="button"
              onClick={() => setFavoritesOnly((v) => !v)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold shadow-sm transition active:scale-[0.98] ${
                favoritesOnly
                  ? 'border-brand/35 bg-brand/12 text-brand ring-1 ring-brand/15'
                  : 'border-stone-200 bg-white text-stone-800 hover:border-stone-300'
              }`}
            >
              <Star className={`h-4 w-4 ${favoritesOnly ? 'fill-current' : ''}`} />
              {t('favorites')}
            </button>
          </div>
          {loading && (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="animate-pulse overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-sm">
                  <div className="aspect-[4/3] bg-gradient-to-br from-stone-200 to-stone-100" />
                  <div className="space-y-2 p-3">
                    <div className="h-3 w-3/4 rounded bg-stone-200" />
                    <div className="h-3 w-1/2 rounded bg-stone-100" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && fetchErr && (
            <div className="rounded-2xl border border-red-200/80 bg-red-50/90 px-5 py-4 text-center text-sm font-medium text-red-900 shadow-sm">
              {errMessage}
            </div>
          )}

          {!loading && !fetchErr && products.length === 0 && (
            <div className="rounded-2xl border border-dashed border-stone-200 bg-white px-6 py-12 text-center shadow-sm">
              <p className="text-stone-600">{t('emptyProducts')}</p>
            </div>
          )}

          {!loading && !fetchErr && products.length > 0 && visibleProducts.length === 0 && (
            <div className="rounded-2xl border border-dashed border-stone-200 bg-white px-6 py-12 text-center shadow-sm">
              <p className="font-medium text-stone-700">{t('noResults')}</p>
            </div>
          )}

          {!loading && !fetchErr && products.length > 0 && visibleProducts.length > 0 && (
            <div className="space-y-12 sm:space-y-16">
              {sections.newProducts.length > 0 && (
                <CategorySection
                  anchorId="cat-new"
                  category={{ id: 'new' }}
                  titleOverride={t('categoryNew')}
                  products={sections.newProducts}
                  onSelectProduct={handleSelectProduct}
                  favorites={favorites}
                  onToggleFavorite={handleToggleFavorite}
                />
              )}
              {sections.ordered.map(({ category, products: list }) => (
                <CategorySection
                  key={category.id}
                  category={category}
                  products={list}
                  onSelectProduct={handleSelectProduct}
                  favorites={favorites}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}

              {sections.uncategorized.length > 0 && (
                <CategorySection
                  category={{ id: null }}
                  titleOverride={t('categoryOther')}
                  products={sections.uncategorized}
                  onSelectProduct={handleSelectProduct}
                  favorites={favorites}
                  onToggleFavorite={handleToggleFavorite}
                />
              )}
            </div>
          )}
        </section>
      </main>

      {selectedProduct && (
        <ProductDetailPanel
          key={selectedProduct.id}
          product={selectedProduct}
          onClose={handleClosePanel}
          onPrev={() => {
            const idx = visibleProducts.findIndex((p) => p.id === selectedProduct.id);
            if (idx < 1) return;
            handleSelectProduct(visibleProducts[idx - 1]);
          }}
          onNext={() => {
            const idx = visibleProducts.findIndex((p) => p.id === selectedProduct.id);
            if (idx === -1 || idx >= visibleProducts.length - 1) return;
            handleSelectProduct(visibleProducts[idx + 1]);
          }}
          relatedProducts={relatedProducts}
          onSelectRelated={handleSelectProduct}
        />
      )}

      {mobileFiltersOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 animate-fade-in bg-stone-900/40 backdrop-blur-[2px]"
            onClick={() => setMobileFiltersOpen(false)}
            aria-label={t('closeFilters')}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-3xl border border-stone-100 bg-white p-5 pb-8 shadow-2xl animate-fade-in">
            <div className="mb-4 flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-bold text-stone-900">{t('filterTitle')}</h3>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="rounded-full p-2 text-stone-500 transition hover:bg-stone-100 hover:text-stone-800"
                aria-label={t('closeFilters')}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <label className="mb-3 block">
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="filter-input"
                placeholder={t('searchPlaceholder')}
                aria-label={t('searchPlaceholder')}
              />
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-input mb-3 cursor-pointer"
            >
              <option value="newest">{t('sortNewest')}</option>
              <option value="oldest">{t('sortOldest')}</option>
              <option value="az">{t('sortAz')}</option>
              <option value="za">{t('sortZa')}</option>
            </select>
            <label className="mb-4 flex items-center gap-2.5 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm font-medium text-stone-800">
              <input
                type="checkbox"
                checked={favoritesOnly}
                onChange={(e) => setFavoritesOnly(e.target.checked)}
                className="h-4 w-4 rounded border-stone-300 text-brand focus:ring-brand/30"
              />
              {t('favoritesOnly')}
            </label>
            <div className="max-h-44 overflow-auto border-t border-stone-100 pt-3">
              <button
                type="button"
                onClick={() => handleSelectCategory(null)}
                className={`mb-2 w-full rounded-xl border-2 border-solid px-3 py-2.5 text-left text-sm transition active:scale-[0.99] ${
                  activeCategoryId == null
                    ? 'border-brand bg-brand-soft font-bold text-brand shadow-sm'
                    : 'border-stone-200 bg-white font-medium text-stone-700 hover:border-stone-300 hover:bg-stone-50'
                }`}
              >
                {t('filterAll')}
              </button>
              <button
                type="button"
                onClick={() => handleSelectCategory('__new__')}
                className={`mb-2 w-full rounded-xl border-2 border-solid px-3 py-2.5 text-left text-sm transition active:scale-[0.99] ${
                  activeCategoryId === '__new__'
                    ? 'border-brand bg-brand-soft font-bold text-brand shadow-sm'
                    : 'border-stone-200 bg-white font-semibold text-stone-800 hover:border-stone-300 hover:bg-stone-50'
                }`}
              >
                {t('categoryNew')}
              </button>
              {categories.map((cat) => {
                const selected =
                  activeCategoryId != null &&
                  String(activeCategoryId) === String(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleSelectCategory(cat.id)}
                    className={`mb-2 w-full rounded-xl border-2 border-solid px-3 py-2.5 text-left text-sm transition active:scale-[0.99] ${
                      selected
                        ? 'border-brand bg-brand-soft font-bold text-brand shadow-sm'
                        : 'border-stone-200 bg-white font-medium text-stone-700 hover:border-stone-300 hover:bg-stone-50'
                    }`}
                  >
                    {categoryLabel(cat, language) || cat.name || '—'}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
