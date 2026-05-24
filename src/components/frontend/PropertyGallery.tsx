'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

  // 主大圖切換：到底就停（不再 % 循環）
  const showPrev = useCallback(() => {
    if (images.length === 0 || selectedIndex <= 0) return;
    setSelectedImageId(images[selectedIndex - 1].id);
  }, [images, selectedIndex]);

  const showNext = useCallback(() => {
    if (images.length === 0 || selectedIndex >= images.length - 1) return;
    setSelectedImageId(images[selectedIndex + 1].id);
  }, [images, selectedIndex]);

  const isFirst = selectedIndex <= 0;
  const isLast = selectedIndex >= images.length - 1;

  const lightboxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // 打開 lightbox 時，把被點擊的那張圖捲到視窗頂端，
    // 之後使用者直接往下滑就能看到後續所有圖。
    const targetId = `lightbox-img-${selectedImage?.id ?? ''}`;
    const target = document.getElementById(targetId);
    if (target && lightboxRef.current) {
      lightboxRef.current.scrollTop = target.offsetTop;
    }

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [lightboxOpen, closeLightbox, selectedImage?.id]);

  const canZoom = selectedImage && !isVideoUrl(selectedImage.url);

  return (
    <>
      <div className="bg-paper-2 p-2 sm:p-3">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_220px] gap-2 sm:gap-3 items-stretch isolate">
          <div className="relative z-0 min-w-0 aspect-[4/3] overflow-hidden rounded-lg">
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
                {!isFirst && (
                  <button
                    type="button"
                    onClick={showPrev}
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/65 rounded-full w-10 h-10 grid place-items-center leading-none"
                    aria-label="上一張"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20 15h-8v3.586a1 1 0 0 1-1.707.707l-6.586-6.586a1 1 0 0 1 0-1.414l6.586-6.586A1 1 0 0 1 12 5.414V9h8a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1" />
                    </svg>
                  </button>
                )}
                {!isLast && (
                  <button
                    type="button"
                    onClick={showNext}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/65 rounded-full w-10 h-10 grid place-items-center leading-none"
                    aria-label="下一張"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M4 9h8V5.414a1 1 0 0 1 1.707-.707l6.586 6.586a1 1 0 0 1 0 1.414l-6.586 6.586A1 1 0 0 1 12 18.586V15H4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1" />
                    </svg>
                  </button>
                )}
              </>
            )}
          </div>

          {images.length > 1 && (
            <div className="hidden lg:block relative min-h-0">
              <div className="absolute inset-0 flex flex-col gap-2 overflow-y-auto scrollbar-hidden pr-1">
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
          ref={lightboxRef}
          className="fixed inset-0 z-[1000] bg-black/95 overflow-y-auto overscroll-contain"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
        >
          {/* 關閉鈕固定在右上角；其他控制移除，使用者直接以滾動瀏覽所有圖 */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
            className="fixed top-4 right-4 z-10 text-white/90 hover:text-white bg-black/50 hover:bg-black/70 rounded-full w-11 h-11 grid place-items-center text-3xl leading-none"
            aria-label="關閉"
          >
            ×
          </button>

          {/* 所有圖／影片一張一張縱向排，使用者往下滑就能看完整輯 */}
          <div className="flex flex-col items-center gap-3 sm:gap-5 py-6 sm:py-10 px-3 sm:px-8">
            {images.map((image) => (
              <div
                key={`lb-${image.id}`}
                id={`lightbox-img-${image.id}`}
                className="w-full max-w-5xl"
                onClick={(e) => e.stopPropagation()}
              >
                {isVideoUrl(image.url) ? (
                  <video
                    src={image.url}
                    className="block w-full max-h-[90vh] bg-black object-contain"
                    controls
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={image.url}
                    alt={title}
                    className="block w-full max-h-[90vh] object-contain select-none"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
