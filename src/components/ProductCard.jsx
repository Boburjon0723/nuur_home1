import {
  productTitle,
  productDescription,
  productImageUrl,
} from '../api/catalog';
import { Heart } from 'lucide-react';
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
      className="group flex cursor-pointer flex-col overflow-hidden rounded-xl border border-stone-200/80 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-md active:scale-[0.98] sm:rounded-2xl"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
        {img ? (
          <img
            src={img}
            alt={title || t('noImage')}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-stone-400">
            —
          </div>
        )}
        <button
          type="button"
          aria-label={t('favorites')}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite?.(product.id);
          }}
          className={`absolute right-2 top-2 rounded-full p-1.5 backdrop-blur-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
            isFavorite
              ? 'bg-brand text-white'
              : 'bg-white/90 text-stone-600 hover:text-brand'
          }`}
        >
          <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>
      <div className="flex flex-1 flex-col p-2 sm:p-4">
        {code ? (
          <p className="mb-1 inline-flex w-fit rounded-md bg-brand/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-brand sm:text-xs">
            {code}
          </p>
        ) : null}
        <h3 className="line-clamp-2 text-xs font-semibold leading-snug text-stone-900 sm:text-sm">
          {title}
        </h3>
        {desc ? (
          <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-stone-600 sm:mt-2 sm:line-clamp-3 sm:text-sm">
            {desc}
          </p>
        ) : null}
        {(missingImage || missingTranslation) && (
          <div className="mt-2 flex gap-1 text-[10px] font-semibold text-amber-700 sm:text-[11px]">
            {missingImage && (
              <span className="rounded bg-amber-100 px-1.5 py-0.5">{t('noImage')}</span>
            )}
            {missingTranslation && (
              <span className="rounded bg-amber-100 px-1.5 py-0.5">
                {t('missingTranslation')}
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
