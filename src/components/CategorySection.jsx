import ProductCard from './ProductCard';
import { categoryLabel } from '../api/catalog';
import { useLanguage } from '../contexts/LanguageContext';

export default function CategorySection({
  category,
  products,
  onSelectProduct,
  titleOverride,
  /** Masalan: cat-new — hash havola uchun */
  anchorId,
  favorites = [],
  onToggleFavorite,
}) {
  const { language } = useLanguage();
  const heading = titleOverride ?? categoryLabel(category, language);

  const sectionId =
    anchorId || (category?.id ? `cat-${category.id}` : 'cat-other');

  return (
    <section className="scroll-mt-28" id={sectionId}>
      <div className="mb-6 flex items-center gap-4 border-b border-surface-200/50 pb-4 sm:mb-8">
        <span
          className="h-8 w-1.5 shrink-0 rounded-r-full bg-brand-accent shadow-sm"
          aria-hidden
        />
        <h2 className="text-2xl font-extrabold tracking-tight text-brand md:text-3xl">
          {heading || '—'}
        </h2>
      </div>
      <ul className="grid grid-cols-2 gap-3 sm:gap-5 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((p) => (
          <li key={p.id} className="animate-fade-in">
            <ProductCard
              product={p}
              onSelect={() => onSelectProduct?.(p)}
              isFavorite={favorites.includes(p.id)}
              onToggleFavorite={onToggleFavorite}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
