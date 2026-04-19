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
}) {
  const { language } = useLanguage();
  const heading =
    titleOverride ?? categoryLabel(category, language);

  const sectionId =
    anchorId ||
    (category?.id ? `cat-${category.id}` : 'cat-other');

  return (
    <section
      className="scroll-mt-24"
      id={sectionId}
    >
      <h2 className="mb-4 border-b border-stone-200 pb-3 text-xl font-bold tracking-tight text-brand sm:mb-6 sm:text-2xl">
        {heading || '—'}
      </h2>
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((p) => (
          <li key={p.id}>
            <ProductCard product={p} onSelect={() => onSelectProduct?.(p)} />
          </li>
        ))}
      </ul>
    </section>
  );
}
