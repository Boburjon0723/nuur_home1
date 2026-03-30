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

  if (!product) return null;

  const title = productTitle(product, language);
  const desc = productDescription(product, language);
  const code = product.size ? String(product.size).trim() : '';
  const closeLabel = t('close');
  const activeImage = images[activeImageIdx] || null;
  const shareUrl =
    typeof window !== 'undefined' ? window.location.href : '';

  function buildShareText() {
    const lines = [
      `${t('navCatalog')}: ${title || '-'}`,
      code ? `${t('categoryOther')}: ${code}` : null,
      clientNote ? `${t('customerNote')}: ${clientNote}` : null,
      shareUrl ? `URL: ${shareUrl}` : null,
      activeImage ? `Image: ${activeImage}` : null,
    ].filter(Boolean);
    return lines.join('\n');
  }

  function handleShare(channel) {
    const text = buildShareText();
    const encoded = encodeURIComponent(text);
    if (channel === 'telegram') {
      window.open(
        `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encoded}`,
        '_blank',
        'noopener,noreferrer'
      );
      return;
    }
    if (channel === 'whatsapp') {
      window.open(
        `https://wa.me/?text=${encoded}`,
        '_blank',
        'noopener,noreferrer'
      );
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(buildShareText());
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
        className="fixed inset-0 z-40 animate-fade-in bg-black/30"
        aria-label={closeLabel}
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-h-screen flex-col bg-white shadow-2xl animate-slide-in-right sm:max-w-lg md:max-w-xl lg:max-w-2xl">
        <div className="flex flex-shrink-0 items-center justify-between border-b border-stone-100 p-4">
          <h3 className="truncate pr-2 text-sm font-bold text-stone-900 sm:text-base">
            {title || '—'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 transition-colors hover:bg-stone-100"
            aria-label={closeLabel}
          >
            <X className="h-5 w-5 text-stone-600" />
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-auto">
          <div className="flex min-h-[40vh] shrink-0 items-center justify-center bg-stone-50 p-4 sm:min-h-[50vh]">
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
            <div className="flex items-center gap-2 border-b border-stone-100 px-4 py-3">
              <button
                type="button"
                onClick={() =>
                  setActiveImageIdx((v) => (v - 1 + images.length) % images.length)
                }
                className="shrink-0 rounded-full border border-stone-200 p-1.5 text-stone-600 transition hover:bg-stone-100"
                aria-label={t('prevImage')}
              >
                <ChevronLeft className="h-4 w-4" />
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
                className="flex min-w-0 flex-1 gap-2 overflow-x-auto overflow-y-hidden"
              >
                {images.map((url, idx) => (
                  <button
                    key={`${url}-${idx}`}
                    type="button"
                    onClick={() => setActiveImageIdx(idx)}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-md border sm:h-20 sm:w-20 ${
                      idx === activeImageIdx ? 'border-brand ring-1 ring-brand/30' : 'border-stone-200'
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
                className="shrink-0 rounded-full border border-stone-200 p-1.5 text-stone-600 transition hover:bg-stone-100"
                aria-label={t('nextImage')}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
          {code ? (
            <p className="border-b border-stone-100 px-4 py-3 font-mono text-sm font-semibold text-brand">
              {code}
            </p>
          ) : null}
          {desc ? (
            <div className="p-4 text-sm leading-relaxed text-stone-700">{desc}</div>
          ) : null}
          <div className="border-t border-stone-100 p-4">
            <h4 className="mb-3 text-sm font-bold text-stone-900">{t('shareToClient')}</h4>
            <label className="mt-2 block text-xs text-stone-600">
              {t('customerNote')}
              <textarea
                rows={3}
                value={clientNote}
                onChange={(e) => setClientNote(e.target.value)}
                placeholder={t('adminNotePlaceholder')}
                className="mt-1 w-full resize-y rounded-md border border-stone-200 px-2 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-brand"
              />
            </label>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleShare('telegram')}
                className="rounded-md bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-600"
              >
                {t('shareTelegram')}
              </button>
              <button
                type="button"
                onClick={() => handleShare('whatsapp')}
                className="rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600"
              >
                {t('shareWhatsapp')}
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="rounded-md border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                {copied ? t('copied') : t('copyText')}
              </button>
            </div>
          </div>
          {relatedProducts.length > 0 && (
            <div className="border-t border-stone-100 p-4">
              <h4 className="mb-3 text-sm font-bold text-stone-900">{t('relatedProducts')}</h4>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {relatedProducts.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onSelectRelated?.(p)}
                    className="overflow-hidden rounded-lg border border-stone-200 text-left text-xs text-stone-700 transition hover:border-brand/40 hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                    aria-label={productTitle(p, language) || String(p.size || 'product')}
                  >
                    <div className="aspect-square w-full bg-stone-100">
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
                        <div className="flex h-full items-center justify-center text-[11px] text-stone-400">
                          {t('noImage')}
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="truncate text-[11px] font-semibold text-brand">
                        {String(p.size || '').trim() || '—'}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-[11px] text-stone-600">
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
