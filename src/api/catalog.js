import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { normalizeDataLang } from './lang.js';

function ensureClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('ENV_MISSING');
  }
}

export function categoryLabel(cat, lang) {
  if (!cat) return '';
  const L = normalizeDataLang(lang);
  return (
    cat[`name_${L}`] ||
    cat.name_uz ||
    cat.name ||
    ''
  );
}

export function productTitle(p, lang) {
  if (!p) return '';
  const L = normalizeDataLang(lang);
  return (
    p[`name_${L}`] ||
    p.name_uz ||
    p.name ||
    ''
  );
}

export function productDescription(p, lang) {
  if (!p) return '';
  const L = normalizeDataLang(lang);
  const text =
    p[`description_${L}`] ||
    p.description_uz ||
    p.description ||
    '';
  return text ? String(text).trim() : '';
}

/**
 * «Arqon» kategoriyasini nom maydonlari bo‘yicha aniqlash (chap panel / header tartibi va sahifa oxirida chiqarish uchun).
 */
export function isArqonCategory(cat) {
  if (!cat) return false;
  const blob = [cat.name, cat.name_uz, cat.name_ru, cat.name_en]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return (
    blob.includes('arqon') ||
    blob.includes('аркан') ||
    blob.includes('веревк') ||
    blob.includes('верёвк') ||
    blob.includes('rope')
  );
}

/** Ro‘yxatda Arqon doim oxirida (header chip va filtr tartibi). */
export function sortCategoriesArqonLast(categories) {
  if (!Array.isArray(categories) || categories.length === 0) return categories;
  const arq = categories.filter(isArqonCategory);
  const rest = categories.filter((c) => !isArqonCategory(c));
  return [...rest, ...arq];
}

export async function fetchCategories() {
  ensureClient();
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, name_uz, name_ru, name_en')
    .order('name', { ascending: true });

  if (error) throw error;
  return sortCategoriesArqonLast(data || []);
}

export async function fetchActiveProducts() {
  ensureClient();
  const { data, error } = await supabase
    .from('products')
    .select(
      `
      id,
      name,
      name_uz,
      name_ru,
      name_en,
      description,
      description_uz,
      description_ru,
      description_en,
      category_id,
      image_url,
      images,
      size,
      is_active,
      show_in_new,
      created_at,
      categories ( id, name, name_uz, name_ru, name_en )
    `
    )
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export function productImageUrl(p) {
  if (Array.isArray(p.images) && p.images.length > 0) return p.images[0];
  if (p.image_url) return p.image_url;
  return null;
}
