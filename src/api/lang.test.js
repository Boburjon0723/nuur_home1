import { describe, expect, it } from 'vitest';
import { albumImageTitle, normalizeDataLang } from './lang';

describe('normalizeDataLang', () => {
  it('returns supported language as-is', () => {
    expect(normalizeDataLang('ru')).toBe('ru');
    expect(normalizeDataLang('en')).toBe('en');
  });

  it('falls back to uz for unknown values', () => {
    expect(normalizeDataLang('de')).toBe('uz');
    expect(normalizeDataLang(undefined)).toBe('uz');
  });
});

describe('albumImageTitle', () => {
  it('uses selected language first', () => {
    const image = {
      title_uz: 'Rasm',
      title_ru: 'Фото',
      title_en: 'Image',
    };
    expect(albumImageTitle(image, 'en')).toBe('Image');
  });

  it('falls back through available language keys', () => {
    const image = {
      title_ru: 'Фото',
      title_en: 'Image',
    };
    expect(albumImageTitle(image, 'uz')).toBe('Фото');
  });
});
