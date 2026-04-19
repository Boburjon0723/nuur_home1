/**
 * Sayt URL uchun QR kodni SVG fayl sifatida yozadi (saytda ko‘rinmaydi).
 * Ishlatish: npm run qr:generate
 * URL: .env dagi VITE_SITE_PUBLIC_URL yoki default prod manzil.
 */
import QRCode from 'qrcode';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outDir = join(root, 'public');
const outPath = join(outDir, 'catalog-site-qr.svg');

const DEFAULT_URL = 'https://catalog-acsessuar.vercel.app';

function readUrlFromDotEnv() {
  const envPath = join(root, '.env');
  if (!existsSync(envPath)) return '';
  const content = readFileSync(envPath, 'utf8');
  const m = content.match(/^\s*VITE_SITE_PUBLIC_URL\s*=\s*(.+)$/m);
  if (!m) return '';
  return m[1].trim().replace(/^["']|["']$/g, '');
}

const raw =
  (process.env.VITE_SITE_PUBLIC_URL || '').trim() ||
  readUrlFromDotEnv() ||
  DEFAULT_URL;
const url = raw.replace(/\/$/, '');

if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

await QRCode.toFile(outPath, url, {
  type: 'svg',
  width: 512,
  margin: 2,
  color: { dark: '#1c1917', light: '#ffffff' },
});

writeFileSync(
  join(outDir, 'catalog-site-qr.url.txt'),
  `${url}\n`,
  'utf8',
);

console.log(`QR yozildi: public/catalog-site-qr.svg → ${url}`);
console.log(`URL matni: public/catalog-site-qr.url.txt`);
