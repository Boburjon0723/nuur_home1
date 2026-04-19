import {
  productTitle,
  productDescription,
  productImageUrl,
} from '../api/catalog';
import { useLanguage } from '../contexts/LanguageContext';

export default function ProductCard({ product, onSelect }) {
  const { language } = useLanguage();
  const title = productTitle(product, language);
  const desc = productDescription(product, language);
  const img = productImageUrl(product);
  const code = product.size ? String(product.size).trim() : '';

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
      className="group flex cursor-pointer flex-col overflow-hidden rounded-xl border border-stone-200/80 bg-white shadow-sm transition hover:border-brand/30 hover:shadow-md active:scale-[0.98] sm:rounded-2xl"
    >
      <div className="aspect-[4/3] w-full overflow-hidden bg-stone-100">
        {img ? (
          <img
            src={img}
            alt=""
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-stone-400">
            —
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-2 sm:p-4">
        {code ? (
          <p className="mb-1 font-mono text-[11px] font-semibold text-brand sm:text-xs">
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
      </div>
    </article>
  );
}
