'use client';

import { useMemo, useState } from 'react';
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

  const selectedImage = useMemo(
    () => images.find((image) => image.id === selectedImageId) ?? images[0] ?? null,
    [images, selectedImageId]
  );

  return (
    <>
      <div className="bg-paper-2">
        <div className="aspect-[16/10] overflow-hidden">
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
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selectedImage.url} alt={title} className="w-full h-full object-cover" />
            )
          ) : (
            <div className="w-full h-full grid place-items-center text-ink-300">{noImageText}</div>
          )}
        </div>
      </div>

      {images.length > 1 && (
        <div className="bg-paper-2 p-2 overflow-x-auto">
          <div className="flex gap-2 w-max">
          {images.map((image) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setSelectedImageId(image.id)}
              className={`overflow-hidden shrink-0 rounded ${selectedImage?.id === image.id ? 'ring-2 ring-brand-green-600' : ''}`}
              aria-label="Select property image"
            >
              {isVideoUrl(image.url) ? (
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 bg-black">
                  <video src={image.url} className="w-full h-full object-cover opacity-80" muted playsInline preload="metadata" />
                  <span className="absolute inset-0 grid place-items-center text-white text-xs font-bold">VIDEO</span>
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image.url} alt="" className="w-24 h-24 sm:w-28 sm:h-28 object-cover" />
              )}
            </button>
          ))}
          </div>
        </div>
      )}
    </>
  );
}
