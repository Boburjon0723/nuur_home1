import { useEffect, useMemo, useState } from 'react';
import { Funnel, Search, SlidersHorizontal, Star, X } from 'lucide-react';
import {
  fetchActiveProducts,
  productDescription,
  productTitle,
} from '../api/catalog';
import { useLocation, useOutletContext, useSearchParams } from 'react-router-dom';
import CategorySection from '../components/CategorySection';
import ProductDetailPanel from '../components/ProductDetailPanel';
import { useLanguage } from '../contexts/LanguageContext';
import { trackEvent } from '../lib/analytics';

const FAVORITES_KEY = 'catalog-vitrina-favorites';

function productIdsMatch(storedId, queryId) {
  const a = String(storedId ?? '').trim();
  const b = String(queryId ?? '').trim();
  if (!a || !b) return false;
  if (a === b) return true;
  const norm = (s) => s.toLowerCase().replace(/-/g, '');
  return norm(a) === norm(b);
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
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useLanguage();

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
    if (!hash || !hash.startsWith('cat-')) return;
    const el = document.getElementById(hash);
    if (el) {
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, [loading, fetchErr, location.hash, products]);

  useEffect(() => {
    if (loading || products.length === 0) return;
    const pid = searchParams.get('product')?.trim() ?? '';
    if (!pid) {
      setSelectedProduct(null);
      return;
    }
    const found = products.find((p) => productIdsMatch(p.id, pid));
    if (found) {
      setSelectedProduct((prev) => (productIdsMatch(prev?.id, found.id) ? prev : found));
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
        const title = productTitle(p, 'uz').toLowerCase();
        const desc = productDescription(p, 'uz').toLowerCase();
        return title.includes(q) || desc.includes(q);
      });
    }
    list.sort((a, b) => {
      if (sortBy === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortBy === 'az') {
        return productTitle(a, 'uz').localeCompare(productTitle(b, 'uz'));
      }
      if (sortBy === 'za') {
        return productTitle(b, 'uz').localeCompare(productTitle(a, 'uz'));
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return list;
  }, [favorites, favoritesOnly, products, searchTerm, sortBy]);

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

    return { ordered, uncategorized };
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
    const seenOrder = new Map(
      viewedProductIds.map((id, index) => [id, index])
    );
    return visibleProducts
      .filter(
        (p) =>
          p.id !== selectedProduct.id && p.category_id === selectedProduct.category_id
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
    const targetId = categoryId ? `cat-${categoryId}` : 'cat-other';
    const el = document.getElementById(targetId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMobileFiltersOpen(false);
  }

  return (
    <div className={`transition-all duration-300 ${selectedProduct ? 'pr-0 sm:pr-[32rem] md:pr-[36rem] lg:pr-[42rem]' : ''}`}>
      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-3 py-8 sm:px-4 sm:py-10 md:px-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside
          className={`hidden self-start rounded-2xl border border-stone-200 bg-white p-4 lg:sticky lg:top-24 lg:block ${
            desktopFiltersOpen ? '' : 'h-fit'
          }`}
        >
          <button
            type="button"
            className="mb-4 inline-flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50"
            onClick={() => setDesktopFiltersOpen((v) => !v)}
            aria-expanded={desktopFiltersOpen}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {t('filterTitle')}
          </button>
          {desktopFiltersOpen && (
            <div className="space-y-3 lg:max-h-[calc(100vh-8.5rem)] lg:overflow-auto lg:pr-1">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-stone-400" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 py-2 pl-8 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  placeholder={t('searchPlaceholder')}
                  aria-label={t('searchPlaceholder')}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-stone-600">{t('sortLabel')}</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 px-2 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  <option value="newest">{t('sortNewest')}</option>
                  <option value="oldest">{t('sortOldest')}</option>
                  <option value="az">{t('sortAz')}</option>
                  <option value="za">{t('sortZa')}</option>
                </select>
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-700">
                <input
                  type="checkbox"
                  checked={favoritesOnly}
                  onChange={(e) => setFavoritesOnly(e.target.checked)}
                />
                {t('favoritesOnly')}
              </label>
              <div className="border-t border-stone-100 pt-3">
                <button
                  type="button"
                  onClick={() => handleSelectCategory(null)}
                  className={`mb-2 w-full rounded-md px-2 py-1.5 text-left text-sm ${
                    activeCategoryId == null ? 'bg-brand/10 text-brand' : 'hover:bg-stone-100'
                  }`}
                >
                  {t('filterAll')}
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleSelectCategory(cat.id)}
                    className={`mb-1 w-full rounded-md px-2 py-1.5 text-left text-sm ${
                      activeCategoryId === cat.id ? 'bg-brand/10 text-brand' : 'hover:bg-stone-100'
                    }`}
                  >
                    {cat.name_uz || cat.name || '—'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        <section>
        <div className="mb-4 flex items-center justify-between gap-2 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-700"
          >
            <Funnel className="h-4 w-4" />
            {t('openFilters')}
          </button>
          <button
            type="button"
            onClick={() => setFavoritesOnly((v) => !v)}
            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium ${
              favoritesOnly ? 'border-brand/40 bg-brand/10 text-brand' : 'border-stone-200 bg-white text-stone-700'
            }`}
          >
            <Star className={`h-4 w-4 ${favoritesOnly ? 'fill-current' : ''}`} />
            {t('favorites')}
          </button>
        </div>
        {loading && (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/3] rounded-xl bg-stone-200" />
                <div className="mt-2 h-3 w-3/4 rounded bg-stone-200" />
                <div className="mt-2 h-3 w-1/2 rounded bg-stone-100" />
              </div>
            ))}
          </div>
        )}

        {!loading && fetchErr && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800">
            {errMessage}
          </div>
        )}

        {!loading && !fetchErr && visibleProducts.length === 0 && (
          <p className="text-center text-stone-600">{t('emptyProducts')}</p>
        )}

        {!loading && !fetchErr && products.length > 0 && (
          <div className="space-y-12 sm:space-y-16">
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
            {!sections.ordered.length && !sections.uncategorized.length && (
              <p className="text-center text-stone-600">{t('noResults')}</p>
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
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => setMobileFiltersOpen(false)}
            aria-label={t('closeFilters')}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-white p-4 shadow-2xl animate-fade-in">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-stone-900">{t('filterTitle')}</h3>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="rounded-full p-1.5 hover:bg-stone-100"
                aria-label={t('closeFilters')}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <label className="mb-2 block">
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-brand"
                placeholder={t('searchPlaceholder')}
                aria-label={t('searchPlaceholder')}
              />
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="mb-3 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
            >
              <option value="newest">{t('sortNewest')}</option>
              <option value="oldest">{t('sortOldest')}</option>
              <option value="az">{t('sortAz')}</option>
              <option value="za">{t('sortZa')}</option>
            </select>
            <label className="mb-3 flex items-center gap-2 text-sm text-stone-700">
              <input
                type="checkbox"
                checked={favoritesOnly}
                onChange={(e) => setFavoritesOnly(e.target.checked)}
              />
              {t('favoritesOnly')}
            </label>
            <div className="max-h-40 overflow-auto border-t border-stone-100 pt-2">
              <button
                type="button"
                onClick={() => handleSelectCategory(null)}
                className="mb-1 w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-stone-100"
              >
                {t('filterAll')}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSelectCategory(cat.id)}
                  className="mb-1 w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-stone-100"
                >
                  {cat.name_uz || cat.name || '—'}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
