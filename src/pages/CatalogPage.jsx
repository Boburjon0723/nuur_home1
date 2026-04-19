import { useEffect, useMemo, useState } from 'react';
import { useOutletContext, useLocation } from 'react-router-dom';
import { fetchActiveProducts } from '../api/catalog';
import CategorySection from '../components/CategorySection';
import ProductDetailPanel from '../components/ProductDetailPanel';
import { useLanguage } from '../contexts/LanguageContext';

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
  const { categories = [] } = useOutletContext() || {};
  const location = useLocation();
  const { t } = useLanguage();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchErr, setFetchErr] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

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

  const sections = useMemo(() => {
    const byCatId = new Map();
    categories.forEach((c) => byCatId.set(c.id, { category: c, products: [] }));

    const uncategorized = [];

    for (const p of products) {
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

    const newProducts = products.filter((p) => p.show_in_new === true);

    return { ordered, uncategorized, newProducts };
  }, [categories, products]);

  return (
    <div
      className={`transition-all duration-300 ${
        selectedProduct ? 'pr-0 sm:pr-[32rem] md:pr-[36rem] lg:pr-[42rem]' : ''
      }`}
    >
      <main className="mx-auto max-w-7xl px-3 py-8 sm:px-4 sm:py-10 md:px-8">
        {loading && (
          <p className="text-center text-stone-600">{t('loading')}</p>
        )}

        {!loading && fetchErr && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800">
            {errMessage}
          </div>
        )}

        {!loading && !fetchErr && products.length === 0 && (
          <p className="text-center text-stone-600">{t('emptyProducts')}</p>
        )}

        {!loading && !fetchErr && products.length > 0 && (
          <div className="space-y-12 sm:space-y-16">
            {sections.newProducts.length > 0 && (
              <CategorySection
                anchorId="cat-new"
                category={{ id: 'new' }}
                titleOverride={t('categoryNew')}
                products={sections.newProducts}
                onSelectProduct={setSelectedProduct}
              />
            )}
            {sections.ordered.map(({ category, products: list }) => (
              <CategorySection
                key={category.id}
                category={category}
                products={list}
                onSelectProduct={setSelectedProduct}
              />
            ))}

            {sections.uncategorized.length > 0 && (
              <CategorySection
                category={{ id: null }}
                titleOverride={t('categoryOther')}
                products={sections.uncategorized}
                onSelectProduct={setSelectedProduct}
              />
            )}
          </div>
        )}
      </main>

      {selectedProduct && (
        <ProductDetailPanel
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}
