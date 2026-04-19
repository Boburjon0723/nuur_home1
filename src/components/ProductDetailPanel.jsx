import { useEffect } from 'react';
import { X } from 'lucide-react';
import {
  productTitle,
  productDescription,
  productImageUrl,
} from '../api/catalog';
import { useLanguage } from '../contexts/LanguageContext';

const PLACEHOLDER = 'https://via.placeholder.com/400x500?text=No+Image';

export default function ProductDetailPanel({ product, onClose }) {
  const { language, t } = useLanguage();

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!product) return null;

  const title = productTitle(product, language);
  const desc = productDescription(product, language);
  const img = productImageUrl(product);
  const code = product.size ? String(product.size).trim() : '';
  const closeLabel = t('close');

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 animate-fade-in bg-black/30"
        aria-label={closeLabel}
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-h-screen flex-col bg-white shadow-2xl animate-slide-in-right sm:max-w-lg md:max-w-xl lg:max-w-2xl">
        <div className="flex flex-shrink-0 items-center justify-between border-b border-stone-100 p-4">
          <h3 className="truncate pr-2 text-sm font-bold text-stone-900 sm:text-base">
            {title || '—'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 transition-colors hover:bg-stone-100"
            aria-label={closeLabel}
          >
            <X className="h-5 w-5 text-stone-600" />
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-auto">
          <div className="flex min-h-[40vh] shrink-0 items-center justify-center bg-stone-50 p-4 sm:min-h-[50vh]">
            {img ? (
              <img
                src={img}
                alt={title || ''}
                className="max-h-[55vh] max-w-full object-contain sm:max-h-[60vh]"
                onError={(e) => {
                  e.target.src = PLACEHOLDER;
                }}
              />
            ) : (
              <span className="text-stone-400">—</span>
            )}
          </div>
          {code ? (
            <p className="border-b border-stone-100 px-4 py-3 font-mono text-sm font-semibold text-brand">
              {code}
            </p>
          ) : null}
          {desc ? (
            <div className="p-4 text-sm leading-relaxed text-stone-700">{desc}</div>
          ) : null}
        </div>
      </div>
    </>
  );
}
