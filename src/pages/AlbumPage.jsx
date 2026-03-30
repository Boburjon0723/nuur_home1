import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Images, X } from 'lucide-react';
import { fetchAlbumImages } from '../api/album';
import { albumImageTitle } from '../api/lang';
import { useLanguage } from '../contexts/LanguageContext';
import { trackEvent } from '../lib/analytics';

const PLACEHOLDER = 'https://via.placeholder.com/400x500?text=No+Image';

function parseFetchError(e) {
  const msg = e?.message || '';
  if (msg === 'ENV_MISSING') return { kind: 'env' };
  return { kind: 'raw', message: msg || '' };
}

export default function AlbumPage() {
  const { language, t } = useLanguage();
  const [albumImages, setAlbumImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchErr, setFetchErr] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [activeThumbIdx, setActiveThumbIdx] = useState(0);
  const thumbsRowRef = useRef(null);

  useEffect(() => {
    trackEvent('album_open', { page: 'album' });
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setFetchErr(null);
      try {
        const rows = await fetchAlbumImages();
        if (!cancelled) setAlbumImages(rows);
      } catch (e) {
        if (!cancelled) setFetchErr(parseFetchError(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const errMessage = useMemo(() => {
    if (!fetchErr) return '';
    if (fetchErr.kind === 'env') return t('envMissingShort');
    return fetchErr.message || t('errGeneric');
  }, [fetchErr, t]);

  const closeLabel = t('close');
  const uniqueAlbumImages = useMemo(() => {
    const seen = new Set();
    return albumImages.filter((img) => {
      const key = String(img.image_url || img.id || '');
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [albumImages]);

  useEffect(() => {
    if (!selectedImage || uniqueAlbumImages.length === 0) return;
    const idx = uniqueAlbumImages.findIndex((img) => img.id === selectedImage.id);
    setActiveThumbIdx(idx >= 0 ? idx : 0);
  }, [selectedImage, uniqueAlbumImages]);

  const goToIndex = useCallback(
    (nextIdx) => {
      if (!uniqueAlbumImages.length) return;
      const normalized =
        ((nextIdx % uniqueAlbumImages.length) + uniqueAlbumImages.length) %
        uniqueAlbumImages.length;
      setActiveThumbIdx(normalized);
      setSelectedImage(uniqueAlbumImages[normalized]);
    },
    [uniqueAlbumImages]
  );

  useEffect(() => {
    if (!selectedImage) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setSelectedImage(null);
      if (e.key === 'ArrowLeft') {
        goToIndex(activeThumbIdx - 1);
      }
      if (e.key === 'ArrowRight') {
        goToIndex(activeThumbIdx + 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeThumbIdx, goToIndex, selectedImage, uniqueAlbumImages]);

  return (
    <div
      className={`min-h-screen bg-stone-50 pb-16 transition-all duration-300 ${
        selectedImage ? 'pr-0 sm:pr-[32rem] md:pr-[36rem] lg:pr-[42rem]' : ''
      }`}
    >
      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-8 md:px-8 lg:px-12">
        <div className="mb-10">
          <span className="mb-2 inline-block text-xs font-bold uppercase tracking-[0.2em] text-brand">
            {t('albumBadge')}
          </span>
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
            {t('albumTitle')}
          </h1>
          <p className="max-w-2xl text-base text-stone-500">{t('albumDesc')}</p>
        </div>

        {loading && (
          <div className="columns-2 gap-4 space-y-4 sm:columns-3 lg:columns-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="mb-4 break-inside-avoid rounded-2xl bg-stone-200 animate-pulse"
                style={{ height: 180 + (i % 5) * 24 }}
              />
            ))}
          </div>
        )}

        {!loading && fetchErr && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800">
            {errMessage}
          </div>
        )}

        {!loading && !fetchErr && albumImages.length === 0 && (
          <div className="rounded-2xl border border-stone-100 bg-white py-20 text-center shadow-sm">
            <Images className="mx-auto mb-4 h-16 w-16 text-stone-300" />
            <p className="mb-6 text-lg text-stone-500">{t('albumEmpty')}</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3 font-bold text-white hover:bg-brand-light"
            >
              {t('toCatalog')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {!loading && !fetchErr && albumImages.length > 0 && (
          <div
            className="columns-2 gap-3 sm:columns-3 sm:gap-4 lg:columns-4"
            style={{ columnGap: 'clamp(0.75rem, 2vw, 1rem)' }}
          >
            {albumImages.map((img) => {
              const title = albumImageTitle(img, language);
              const format = img.format || 'portrait';
              const aspectClass =
                format === 'square'
                  ? 'aspect-square'
                  : format === 'landscape'
                    ? 'aspect-[3/2]'
                    : format === 'large'
                      ? 'aspect-[3/2] sm:aspect-[16/9]'
                      : 'aspect-[4/5]';
              const spanClass =
                format === 'large'
                  ? 'column-span-2 break-inside-avoid'
                  : 'break-inside-avoid';

              return (
                <div
                  key={img.id}
                  className={`${spanClass} group mb-3 cursor-pointer sm:mb-4`}
                  onClick={() => {
                    const idx = uniqueAlbumImages.findIndex((x) => x.id === img.id);
                    setSelectedImage(img);
                    setActiveThumbIdx(idx >= 0 ? idx : 0);
                  }}
                >
                  <div
                    className={`overflow-hidden rounded-xl border border-stone-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition-all duration-300 hover:border-brand/30 hover:shadow-[0_20px_50px_rgba(30,58,95,0.15)] active:scale-[0.98] sm:rounded-2xl sm:hover:-translate-y-1 ${
                      selectedImage?.id === img.id
                        ? 'border-2 border-brand shadow-lg ring-2 ring-brand/30'
                        : ''
                    }`}
                  >
                    <div className={`relative ${aspectClass} overflow-hidden bg-stone-50`}>
                      <img
                        src={img.image_url}
                        alt={title || 'Album'}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => {
                          e.target.src = PLACEHOLDER;
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      <div className="absolute bottom-0 left-0 right-0 translate-y-full p-3 transition-transform duration-300 group-hover:translate-y-0 sm:p-4">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white sm:text-sm">
                          {t('viewImage')}
                          <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </span>
                      </div>
                    </div>
                    {title ? (
                      <div className="p-3 sm:p-4">
                        <h3 className="line-clamp-2 text-xs font-bold text-stone-900 sm:text-sm">
                          {title}
                        </h3>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedImage && (
        <>
          <div
            className="pointer-events-none fixed inset-0 z-40 animate-fade-in bg-black/30"
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 right-0 z-50 flex w-full max-h-screen flex-col bg-white shadow-2xl animate-slide-in-right sm:max-w-lg md:max-w-xl lg:max-w-2xl">
            <div className="flex flex-shrink-0 items-center justify-between border-b border-stone-100 p-4">
              <h3 className="truncate pr-2 text-sm font-bold text-stone-900 sm:text-base">
                {albumImageTitle(selectedImage, language)}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="rounded-full p-2 transition-colors hover:bg-stone-100"
                aria-label={closeLabel}
              >
                <X className="h-5 w-5 text-stone-600" />
              </button>
            </div>
            <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-4">
              <img
                src={selectedImage.image_url}
                alt={
                  albumImageTitle(selectedImage, language) || 'Album'
                }
                className="max-h-full max-w-full object-contain"
                onError={(e) => {
                  e.target.src = PLACEHOLDER;
                }}
              />
            </div>
            {uniqueAlbumImages.length > 1 && (
              <div className="flex items-center gap-2 border-t border-stone-100 px-4 py-3">
                <button
                  type="button"
                  onClick={() => goToIndex(activeThumbIdx - 1)}
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
                  {uniqueAlbumImages.map((img, idx) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => goToIndex(idx)}
                      className={`h-16 w-16 shrink-0 overflow-hidden rounded-md border sm:h-20 sm:w-20 ${
                        idx === activeThumbIdx
                          ? 'border-brand ring-1 ring-brand/30'
                          : 'border-stone-200'
                      }`}
                      aria-label={albumImageTitle(img, language) || 'Album image'}
                      aria-current={idx === activeThumbIdx ? 'true' : undefined}
                    >
                      <img
                        src={img.image_url}
                        alt=""
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.target.src = PLACEHOLDER;
                        }}
                      />
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => goToIndex(activeThumbIdx + 1)}
                  className="shrink-0 rounded-full border border-stone-200 p-1.5 text-stone-600 transition hover:bg-stone-100"
                  aria-label={t('nextImage')}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
