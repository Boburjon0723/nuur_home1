import { supabase, isSupabaseConfigured } from '../supabaseClient';

function ensureClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('ENV_MISSING');
  }
}

export async function fetchAlbumImages() {
  ensureClient();
  const { data, error } = await supabase
    .from('album_images')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data || [];
}
