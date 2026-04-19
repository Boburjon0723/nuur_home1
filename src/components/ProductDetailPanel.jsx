import { useEffect, useRef, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import {
  productImageUrl,
  productTitle,
  productDescription,
} from '../api/catalog';
import { useLanguage } from '../contexts/LanguageContext';

const PLACEHOLDER = 'https://via.placeholder.com/400x500?text=No+Image';

export default function ProductDetailPanel({
  product,
  onClose,
  onPrev,
  onNext,
  relatedProducts = [],
  onSelectRelated,
}) {
  const { language, t } = useLanguage();
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [clientNote, setClientNote] = useState('');
  const [copied, setCopied] = useState(false);
  const thumbsRowRef = useRef(null);

  const images = useMemo(() => {
    if (!product) return [];
    if (Array.isArray(product.images) && product.images.length > 0) {
      return product.images.filter(Boolean);
    }
    const cover = productImageUrl(product);
    return cover ? [cover] : [];
  }, [product]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev?.();
      if (e.key === 'ArrowRight') onNext?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onPrev, onNext]);

  /** Katalog: `/catalog?product=...` — bosganda shu mahsulot ochiladi. */
  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined' || !product?.id) return '';
    const configured = (import.meta.env.VITE_SHARE_BASE_URL || '').trim().replace(/\/$/, '');
    const origin = configured || window.location.origin;
    const u = new URL('/catalog', origin);
    u.searchParams.set('product', String(product.id));
    return u.toString();
  }, [product]);

  if (!product) return null;

  const title = productTitle(product, language);
  const desc = productDescription(product, language);
  const code = product.size ? String(product.size).trim() : '';
  const closeLabel = t('close');
  const activeImage = images[activeImageIdx] || null;

  /** Matn: faqat kod + izoh (havola alohida yuboriladi / pastda bir marta). */
  function buildShareCaption() {
    const lines = [
      code ? `${t('productCode')}: ${code}` : null,
      clientNote ? `${t('customerNote')}: ${clientNote}` : null,
    ].filter(Boolean);
    if (lines.length > 0) return lines.join('\n');
    return title ? `${t('navCatalog')}: ${title || '—'}` : '';
  }

  /** WhatsApp va nusxa: izoh + bitta havola. */
  function buildShareMessageWithLink() {
    const cap = buildShareCaption();
    if (!shareUrl) return cap;
    if (!cap) return shareUrl;
    return `${cap}\n\n${shareUrl}`;
  }

  function handleShare(channel) {
    const caption = buildShareCaption();
    const encodedCaption = encodeURIComponent(caption);
    if (channel === 'telegram') {
      window.open(
        `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodedCaption}`,
        '_blank',
        'noopener,noreferrer'
      );
      return;
    }
    if (channel === 'whatsapp') {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(buildShareMessageWithLink())}`,
        '_blank',
        'noopener,noreferrer'
      );
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(buildShareMessageWithLink());
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* ignore */
    }
  }

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 animate-fade-in bg-brand/40 backdrop-blur-sm"
        aria-label={closeLabel}
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-h-screen flex-col bg-white/90 shadow-2xl backdrop-blur-2xl animate-slide-in-right sm:max-w-lg md:max-w-xl lg:max-w-2xl border-l border-surface-200/50">
        <div className="flex flex-shrink-0 items-center justify-between border-b border-surface-200/50 p-5 bg-white/50 backdrop-blur-3xl">
          <h3 className="truncate pr-4 text-base font-extrabold text-brand sm:text-lg">
            {title || '—'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-surface-100/80 p-2.5 transition-all hover:bg-brand hover:text-white"
            aria-label={closeLabel}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-auto">
          <div className="flex min-h-[40vh] shrink-0 items-center justify-center bg-surface-100/50 p-4 sm:min-h-[50vh]">
            {activeImage ? (
              <img
                src={activeImage}
                alt={title || t('noImage')}
                className={`max-h-[55vh] max-w-full cursor-zoom-in object-contain transition sm:max-h-[60vh] ${
                  zoomed ? 'scale-125' : 'scale-100'
                }`}
                aria-label={t('imageZoomHint')}
                onClick={() => setZoomed((v) => !v)}
                onError={(e) => {
                  e.target.src = PLACEHOLDER;
                }}
              />
            ) : (
              <span className="text-stone-400">—</span>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex items-center gap-3 border-b border-surface-200/50 px-5 py-4">
              <button
                type="button"
                onClick={() =>
                  setActiveImageIdx((v) => (v - 1 + images.length) % images.length)
                }
                className="shrink-0 rounded-full border border-surface-200/80 p-2 text-surface-600 transition hover:bg-surface-100 hover:text-brand"
                aria-label={t('prevImage')}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div
                ref={thumbsRowRef}
                onWheel={(e) => {
                  if (!thumbsRowRef.current) return;
                  e.preventDefault();
                  e.stopPropagation();
                  const delta =
                    Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
                  thumbsRowRef.current.scrollLeft += delta;
                }}
                className="flex min-w-0 flex-1 gap-2.5 overflow-x-auto overflow-y-hidden"
              >
                {images.map((url, idx) => (
                  <button
                    key={`${url}-${idx}`}
                    type="button"
                    onClick={() => setActiveImageIdx(idx)}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 sm:h-20 sm:w-20 transition-all ${
                      idx === activeImageIdx ? 'border-brand-accent scale-105 shadow-md' : 'border-transparent hover:border-surface-300'
                    }`}
                    aria-current={idx === activeImageIdx ? 'true' : undefined}
                  >
                    <img src={url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setActiveImageIdx((v) => (v + 1) % images.length)}
                className="shrink-0 rounded-full border border-surface-200/80 p-2 text-surface-600 transition hover:bg-surface-100 hover:text-brand"
                aria-label={t('nextImage')}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
          {code ? (
            <div className="border-b border-surface-200/50 px-5 py-4">
              <span className="inline-block rounded-lg bg-surface-100 px-3 py-1 font-mono text-sm font-bold tracking-wider text-surface-700">
                {code}
              </span>
            </div>
          ) : null}
          {desc ? (
            <div className="p-5 text-[15px] leading-relaxed text-surface-600">{desc}</div>
          ) : null}
          <div className="border-t border-surface-200/50 p-5 p-5">
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-surface-500">{t('shareToClient')}</h4>
            <label className="mt-2 block text-sm font-medium text-brand">
              {t('customerNote')}
              <textarea
                rows={3}
                value={clientNote}
                onChange={(e) => setClientNote(e.target.value)}
                placeholder={t('adminNotePlaceholder')}
                className="mt-2 w-full resize-y rounded-xl border border-surface-200/70 bg-white/50 px-3 py-2 text-sm shadow-sm outline-none transition-all focus:border-brand-accent focus:bg-white focus:ring-4 focus:ring-brand-accent/10"
              />
            </label>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => handleShare('telegram')}
                className="rounded-xl bg-[#0088cc] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0088cc]/90 active:scale-95 shadow-sm"
              >
                {t('shareTelegram')}
              </button>
              <button
                type="button"
                onClick={() => handleShare('whatsapp')}
                className="rounded-xl bg-[#25D366] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#25D366]/90 active:scale-95 shadow-sm"
              >
                {t('shareWhatsapp')}
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="rounded-xl border border-surface-200/70 bg-white px-4 py-2 text-sm font-semibold text-brand transition hover:border-brand-accent hover:text-brand-accent active:scale-95 shadow-sm"
              >
                {copied ? t('copied') : t('copyText')}
              </button>
            </div>
          </div>
          {relatedProducts.length > 0 && (
            <div className="border-t border-surface-200/50 p-5">
              <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-surface-500">{t('relatedProducts')}</h4>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {relatedProducts.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onSelectRelated?.(p)}
                    className="overflow-hidden rounded-xl border border-surface-200/50 bg-white/50 text-left text-xs transition-all hover:-translate-y-1 hover:border-surface-300 hover:shadow-card hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
                    aria-label={productTitle(p, language) || String(p.size || 'product')}
                  >
                    <div className="aspect-square w-full bg-surface-100">
                      {productImageUrl(p) ? (
                        <img
                          src={productImageUrl(p)}
                          alt={productTitle(p, language) || t('noImage')}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            e.target.src = PLACEHOLDER;
                          }}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[11px] text-surface-400">
                          {t('noImage')}
                        </div>
                      )}
                    </div>
                    <div className="px-3 py-2.5">
                      <p className="truncate text-xs font-bold text-brand">
                        {String(p.size || '').trim() || '—'}
                      </p>
                      <p className="mt-1 line-clamp-1 text-xs text-surface-500">
                        {productTitle(p, language) || '—'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
