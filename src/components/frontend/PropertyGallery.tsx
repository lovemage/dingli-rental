'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { isVideoUrl } from '@/lib/property-media';

type GalleryImage = {
  id: number;
  url: string;
};

export default function PropertyGallery({
  images,
  title,
  noImageText,
}: {
  images: GalleryImage[];
  title: string;
  noImageText: string;
}) {
  const [selectedImageId, setSelectedImageId] = useState<number | null>(images[0]?.id ?? null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const selectedIndex = useMemo(() => {
    const idx = images.findIndex((image) => image.id === selectedImageId);
    return idx >= 0 ? idx : 0;
  }, [images, selectedImageId]);

  const selectedImage = images[selectedIndex] ?? null;

  const closeLightbox = useCallback(() => setLightboxOpen(false), []);

  const showPrev = useCallback(() => {
    if (images.length === 0) return;
    const next = (selectedIndex - 1 + images.length) % images.length;
    setSelectedImageId(images[next].id);
  }, [images, selectedIndex]);

  const showNext = useCallback(() => {
    if (images.length === 0) return;
    const next = (selectedIndex + 1) % images.length;
    setSelectedImageId(images[next].id);
  }, [images, selectedIndex]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft') showPrev();
      else if (e.key === 'ArrowRight') showNext();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [lightboxOpen, closeLightbox, showPrev, showNext]);

  const canZoom = selectedImage && !isVideoUrl(selectedImage.url);

  return (
    <>
      <div className="bg-paper-2 p-2 sm:p-3">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_220px] gap-2 sm:gap-3 items-stretch">
          <div className="relative aspect-[16/10] overflow-hidden rounded-lg">
            {selectedImage ? (
              isVideoUrl(selectedImage.url) ? (
                <video
                  src={selectedImage.url}
                  className="w-full h-full object-cover bg-black"
                  controls
                  playsInline
                  preload="metadata"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  className="block w-full h-full cursor-zoom-in"
                  aria-label="放大圖片"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selectedImage.url} alt={title} className="w-full h-full object-cover" />
                </button>
              )
            ) : (
              <div className="w-full h-full grid place-items-center text-ink-300">{noImageText}</div>
            )}

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={showPrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/65 rounded-full w-10 h-10 grid place-items-center text-2xl leading-none"
                  aria-label="上一張"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={showNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/65 rounded-full w-10 h-10 grid place-items-center text-2xl leading-none"
                  aria-label="下一張"
                >
                  ›
                </button>
              </>
            )}
          </div>

          {images.length > 1 && (
            <div className="hidden lg:flex flex-col gap-2 h-full min-h-0 overflow-y-auto scrollbar-hidden pr-1">
              {images.map((image) => (
                <button
                  key={`side-${image.id}`}
                  type="button"
                  onClick={() => setSelectedImageId(image.id)}
                  className={`overflow-hidden shrink-0 rounded-md border ${selectedImage?.id === image.id ? 'ring-2 ring-brand-green-600 border-brand-green-600' : 'border-line'}`}
                  aria-label="Select property image"
                >
                  {isVideoUrl(image.url) ? (
                    <div className="relative w-full aspect-[4/3] bg-black">
                      <video src={image.url} className="w-full h-full object-cover opacity-80" muted playsInline preload="metadata" />
                      <span className="absolute inset-0 grid place-items-center text-white text-xs font-bold">VIDEO</span>
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image.url} alt="" className="w-full aspect-[4/3] object-cover" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {images.length > 1 && (
        <div className="lg:hidden bg-paper-2 px-2 pb-2 sm:px-3 sm:pb-3 overflow-x-auto">
          <div className="flex gap-2 w-max">
            {images.map((image) => (
              <button
                key={image.id}
                type="button"
                onClick={() => setSelectedImageId(image.id)}
                className={`overflow-hidden shrink-0 rounded-md border ${selectedImage?.id === image.id ? 'ring-2 ring-brand-green-600 border-brand-green-600' : 'border-line'}`}
                aria-label="Select property image"
              >
                {isVideoUrl(image.url) ? (
                  <div className="relative w-24 sm:w-28 aspect-[4/3] bg-black">
                    <video src={image.url} className="w-full h-full object-cover opacity-80" muted playsInline preload="metadata" />
                    <span className="absolute inset-0 grid place-items-center text-white text-xs font-bold">VIDEO</span>
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image.url} alt="" className="w-24 sm:w-28 aspect-[4/3] object-cover" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {lightboxOpen && canZoom && selectedImage && (
        <div
          className="fixed inset-0 z-[1000] bg-black/90 flex items-center justify-center p-4 sm:p-8"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
            className="absolute top-4 right-4 text-white/90 hover:text-white bg-black/40 hover:bg-black/60 rounded-full w-10 h-10 grid place-items-center text-2xl leading-none"
            aria-label="關閉"
          >
            ×
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); showPrev(); }}
                className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 text-white/90 hover:text-white bg-black/40 hover:bg-black/60 rounded-full w-11 h-11 grid place-items-center text-2xl leading-none"
                aria-label="上一張"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); showNext(); }}
                className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 text-white/90 hover:text-white bg-black/40 hover:bg-black/60 rounded-full w-11 h-11 grid place-items-center text-2xl leading-none"
                aria-label="下一張"
              >
                ›
              </button>
            </>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selectedImage.url}
            alt={title}
            className="max-w-full max-h-full object-contain select-none"
            onClick={(e) => e.stopPropagation()}
          />

          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm bg-black/40 px-3 py-1 rounded-full">
              {selectedIndex + 1} / {images.length}
            </div>
          )}
        </div>
      )}
    </>
  );
}
