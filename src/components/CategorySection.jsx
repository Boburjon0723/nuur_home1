import ProductCard from './ProductCard';
import { categoryLabel } from '../api/catalog';
import { useLanguage } from '../contexts/LanguageContext';

export default function CategorySection({
  category,
  products,
  onSelectProduct,
  titleOverride,
  favorites = [],
  onToggleFavorite,
}) {
  const { language } = useLanguage();
  const heading =
    titleOverride ?? categoryLabel(category, language);

  return (
    <section
      className="scroll-mt-24"
      id={category?.id ? `cat-${category.id}` : 'cat-other'}
    >
      <h2 className="mb-4 border-b border-stone-200 pb-3 text-xl font-bold tracking-tight text-brand sm:mb-6 sm:text-2xl">
        {heading || '—'}
      </h2>
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((p) => (
          <li key={p.id}>
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
