# Katalog vitrinasi

Mahsulotlar **kategoriyalar bo‘yicha** guruhlangan, **narx va sharhlar yo‘q**. Asosiy do‘kondan alohida **alohida Git repoga** chiqarish uchun mo‘ljallangan.

## Talablar

- Node.js 18+
- Supabase loyihangizda `products` va `categories` jadvallari (asosiy loyiha bilan bir xil)

## O‘rnatish

```bash
cd catalog-vitrina
npm install
```

`.env` faylini yarating (`.env.example` dan nusxa):

```bash
copy .env.example .env
```

`VITE_SUPABASE_URL` va `VITE_SUPABASE_ANON_KEY` ni to‘ldiring.

## Tilllar

- **O‘zbek / Русский / English** — header o‘ngidagi tanlovda; tanlov `localStorage` da saqlanadi.
- Mahsulot va kategoriya nomlari — Supabase dagi `name_uz`, `name_ru`, `name_en` maydonlaridan.

## Sahifalar

- `/` — mahsulotlar kategoriyalar bo‘yicha (headerda kategoriya tugmalari)
- `/album` — albom rasmlari (asosiy do‘kondagi kabi masonry + yon panel)

## Ishga tushirish

```bash
npm run dev
```

Brauzer: `http://localhost:3000` (port `vite.config.js` da)

## Build

```bash
npm run build
```

Natija: `dist/` — statik hostingga yuklash mumkin.

## Alohida Git repoga chiqarish

1. Yangi repoga bo‘sh commit bilan boshlang (GitHub/GitLab).
2. Ushbu papkani nusxalang yoki faqat `catalog-vitrina` ichini yangi repoga ko‘chiring:

```bash
cd catalog-vitrina
git init
git add .
git commit -m "Initial: katalog vitrinasi"
git branch -M main
git remote add origin https://github.com/SIZ/repo-nomi.git
git push -u origin main
```

3. Hosting (Vercel, Netlify, Cloudflare Pages): build command `npm run build`, output `dist`, environment variables — `.env` dagi `VITE_*` lar.

## Eslatma

- Faqat `is_active = true` mahsulotlar chiqadi.
- Narx, reyting, sharhlar UI va so‘rovlarda ishlatilmaydi.
