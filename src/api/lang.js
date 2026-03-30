export function normalizeDataLang(lang) {
  const key = String(lang || 'uz').toLowerCase();
  if (key === 'ru' || key === 'en') return key;
  return 'uz';
}

export function albumImageTitle(img, lang) {
  const L = normalizeDataLang(lang);
  return (
    img[`title_${L}`] ||
    img.title_uz ||
    img.title_ru ||
    img.title_en ||
    ''
  );
}
