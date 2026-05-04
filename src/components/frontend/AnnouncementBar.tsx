'use client';

import { usePathname } from 'next/navigation';
import type { AnnouncementSettings } from '@/data/announcement-defaults';

type Props = { settings: AnnouncementSettings };

export default function AnnouncementBar({ settings }: Props) {
  const pathname = usePathname();
  if (!settings.enabled || !settings.text.trim()) return null;
  // 不在後台顯示
  if (pathname?.startsWith('/admin')) return null;

  const isMarquee = settings.effect === 'marquee' || settings.effect === 'marquee-reverse';
  const wrapperClass = `ann-${settings.effect}`;

  return (
    <div className="bg-brand-orange-700 text-white text-sm font-medium overflow-hidden border-b border-brand-orange-700/40">
      <div className="container-page py-2">
        {isMarquee ? (
          <div className={wrapperClass}>
            <div className="ann-track">
              <span className="px-6">{settings.text}</span>
              <span className="px-6" aria-hidden>{settings.text}</span>
            </div>
          </div>
        ) : (
          <div className={`text-center ${wrapperClass}`}>
            <span className="ann-text">{settings.text}</span>
          </div>
        )}
      </div>
    </div>
  );
}
