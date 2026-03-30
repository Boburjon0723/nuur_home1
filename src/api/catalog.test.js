import { describe, expect, it } from 'vitest';
import {
  categoryLabel,
  productDescription,
  productImageUrl,
  productTitle,
} from './catalog';

describe('catalog text helpers', () => {
  it('resolves category and product title by language with fallback', () => {
    const category = { name_uz: 'Kiyim', name_ru: 'Одежда' };
    const product = { name_uz: 'Kofta', name_ru: 'Свитер' };

    expect(categoryLabel(category, 'ru')).toBe('Одежда');
    expect(categoryLabel(category, 'en')).toBe('Kiyim');
    expect(productTitle(product, 'ru')).toBe('Свитер');
    expect(productTitle(product, 'en')).toBe('Kofta');
  });

  it('trims product description and returns empty string for missing values', () => {
    expect(productDescription({ description_en: '  test text  ' }, 'en')).toBe(
      'test text'
    );
    expect(productDescription({}, 'en')).toBe('');
  });
});

describe('productImageUrl', () => {
  it('prefers images array and falls back to image_url', () => {
    expect(productImageUrl({ images: ['first.jpg'], image_url: 'second.jpg' })).toBe(
      'first.jpg'
    );
    expect(productImageUrl({ images: [], image_url: 'second.jpg' })).toBe('second.jpg');
    expect(productImageUrl({})).toBeNull();
  });
});
