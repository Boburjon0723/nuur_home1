-- Vitrina: «Yangi» bo‘limi — mahsulotlar o‘z kategoriyasida qoladi, bu flag qo‘lda yoqiladi.
-- Supabase → SQL Editor → Run

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS show_in_new BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.products.show_in_new IS
  'True: katalog vitrinasida «Yangi» bo‘limida ko‘rsatiladi (qo‘lda). category_id o‘zgarmaydi.';

CREATE INDEX IF NOT EXISTS idx_products_show_in_new ON public.products (show_in_new) WHERE show_in_new = true;
