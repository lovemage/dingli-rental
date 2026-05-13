'use client';

import { useEffect, useState } from 'react';

export type HeroSlide = {
  id: number;
  imageUrl: string;
  title?: string | null;
  subtitle?: string | null;
};

type Props = {
  slides: HeroSlide[];
  intervalSec: number;
  className?: string;
  showCaptions?: boolean;
};

export default function HeroCarousel({
  slides,
  intervalSec,
  className = '',
  showCaptions = true,
}: Props) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const ms = Math.max(2, intervalSec) * 1000;
    const id = setInterval(() => {
      setActive((i) => (i + 1) % slides.length);
    }, ms);
    return () => clearInterval(id);
  }, [slides.length, intervalSec]);

  if (slides.length === 0) {
    return (
      <div className={`hero-carousel bg-paper-2 grid place-items-center text-ink-500 ${className}`}>
        尚未上傳輪播圖片
      </div>
    );
  }

  return (
    <div className={`hero-carousel ${className}`}>
      {slides.map((s, i) => (
        <div key={s.id} className={`hero-slide ${i === active ? 'active' : ''}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={s.imageUrl} alt={s.title || `slide-${i + 1}`} loading={i === 0 ? 'eager' : 'lazy'} />
          {showCaptions && (s.title || s.subtitle) && (
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-ink-900/60 to-transparent text-white">
              {s.title && <h3 className="font-bold text-lg">{s.title}</h3>}
              {s.subtitle && <p className="text-sm opacity-90">{s.subtitle}</p>}
            </div>
          )}
        </div>
      ))}
      {slides.length > 1 && (
        <div className="hero-dots">
          {slides.map((_, i) => (
            <button
              key={i}
              className={i === active ? 'active' : ''}
              onClick={() => setActive(i)}
              aria-label={`切換到第 ${i + 1} 張`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
