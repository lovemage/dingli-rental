'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';
import type { FloatingCtaContent } from '@/data/floating-cta-defaults';

export default function FloatingCta({ config }: { config: FloatingCtaContent }) {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);

  // 在後台 / 登入頁不顯示
  if (!config.enabled) return null;
  if (pathname?.startsWith('/admin')) return null;
  if (hidden) return null;

  const isLine = /\blin(\.|e\.)/.test(config.linkUrl);

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex items-end gap-2 group">
      {/* 關閉鈕 */}
      <button
        type="button"
        onClick={() => setHidden(true)}
        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border border-line shadow-md grid place-items-center text-ink-500 hover:text-ink-900 text-xs z-10"
        aria-label="關閉浮動按鈕"
      >
        ✕
      </button>

      <a
        href={config.linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={config.label}
        className="flex items-center gap-3 bg-white border border-line shadow-lg hover:shadow-xl rounded-full pr-5 pl-1.5 py-1.5 transition-all hover:-translate-y-0.5 active:translate-y-0"
      >
        {/* 頭像 */}
        <span className="relative flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={config.avatarUrl}
            alt=""
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-white"
            style={{ objectPosition: 'center 20%' }}
          />
          {/* 線上小綠點 */}
          <span className="absolute bottom-0.5 right-0.5 block w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
        </span>

        {/* 文字（手機隱藏，平板以上顯示） */}
        <span className="hidden sm:flex flex-col leading-tight">
          <span className="flex items-center gap-1.5 font-extrabold text-sm text-ink-900">
            {isLine && (
              <span className="inline-grid place-items-center w-5 h-5 rounded bg-[#06C755] text-white text-[10px] font-black leading-none">
                LINE
              </span>
            )}
            {config.bubbleTitle}
          </span>
          <span className="text-xs text-ink-500">{config.bubbleSubtitle}</span>
        </span>
      </a>
    </div>
  );
}
