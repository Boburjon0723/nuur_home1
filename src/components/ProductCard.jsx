import {
  productTitle,
  productDescription,
  productImageUrl,
} from '../api/catalog';
import { ArrowRight, Heart } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function ProductCard({
  product,
  onSelect,
  onToggleFavorite,
  isFavorite = false,
}) {
  const { language, t } = useLanguage();
  const title = productTitle(product, language);
  const desc = productDescription(product, language);
  const img = productImageUrl(product);
  const code = product.size ? String(product.size).trim() : '';
  const missingTranslation = !title || !desc;
  const missingImage = !img;

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.();
        }
      }}
      aria-label={title || t('noImage')}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-[1.25rem] border border-surface-200/50 bg-white/80 shadow-card backdrop-blur-sm transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-card-hover hover:border-surface-300 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/40"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-100">
        {img ? (
          <img
            src={img}
            alt=""
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm font-medium text-surface-400">
            —
          </div>
        )}
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand/60 via-brand/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex translate-y-3 items-center justify-center gap-2 pb-4 text-xs font-semibold text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <span>{t('viewImage')}</span>
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </div>
        <button
          type="button"
          aria-label={t('favorites')}
          aria-pressed={isFavorite}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite?.(product.id);
          }}
          className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full shadow-md backdrop-blur-md transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90 ${
            isFavorite
              ? 'bg-brand-accent text-white scale-100'
              : 'bg-white/80 text-surface-500 hover:scale-110 hover:bg-white hover:text-brand-accent active:scale-95'
          }`}
        >
          <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {code ? (
          <p className="mb-2 w-fit rounded-lg bg-surface-100 px-2.5 py-1 font-mono text-[11px] font-bold tracking-wider text-surface-600 sm:text-xs">
            {code}
          </p>
        ) : null}
        <h3 className="line-clamp-2 text-[15px] font-bold leading-snug tracking-tight text-brand">
          {title || '—'}
        </h3>
        {desc ? (
          <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-surface-500 sm:line-clamp-3">
            {desc}
          </p>
        ) : null}
        {(missingImage || missingTranslation) && (
          <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-semibold sm:text-[11px]">
            {missingImage && (
              <span className="rounded-md bg-amber-50 px-2 py-1 text-amber-600 border border-amber-200/50">
                {t('noImage')}
              </span>
            )}
            {missingTranslation && (
              <span className="rounded-md bg-amber-50 px-2 py-1 text-amber-600 border border-amber-200/50">
                {t('missingTranslation')}
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
