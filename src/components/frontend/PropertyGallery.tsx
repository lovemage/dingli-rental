'use client';

import { useMemo, useState } from 'react';

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
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-1 bg-paper-2">
        <div className="aspect-[16/10] overflow-hidden">
          {selectedImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={selectedImage.url} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full grid place-items-center text-ink-300">{noImageText}</div>
          )}
        </div>
        <div className="hidden lg:grid gap-1 max-h-[600px] overflow-y-auto">
          {images.slice(1).map((image) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setSelectedImageId(image.id)}
              className={`overflow-hidden ${selectedImage?.id === image.id ? 'ring-2 ring-brand-green-600' : ''}`}
              aria-label="Select property image"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.url} alt="" className="w-full h-36 object-cover" />
            </button>
          ))}
        </div>
      </div>

      {images.length > 1 && (
        <div className="lg:hidden bg-paper-2 p-1 grid grid-cols-4 gap-1">
          {images.map((image) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setSelectedImageId(image.id)}
              className={`overflow-hidden ${selectedImage?.id === image.id ? 'ring-2 ring-brand-green-600' : ''}`}
              aria-label="Select property image"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.url} alt="" className="w-full aspect-square object-cover" />
            </button>
          ))}
        </div>
      )}
    </>
  );
}
