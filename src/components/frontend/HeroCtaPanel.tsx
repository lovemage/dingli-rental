import Link from 'next/link';

type Props = {
  primaryText: string;
  primaryHref: string;
  secondaryText: string;
  secondaryHref: string;
};

/** 主按鈕用：搜尋（放大鏡）圖示，沿用 hero 提供的 SVG */
function SearchGlyph() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21l-4.35-4.35" />
    </svg>
  );
}

/** 次要按鈕用：委託（剪貼板）圖示 */
function ClipboardGlyph() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4zm4-7v3m4-3v3m4-3v3" />
    </svg>
  );
}

/**
 * Hero 區的 CTA 按鈕列。
 * 之前主按鈕是「展開→四個物件分類短連結」的兩段式互動，
 * 經產品決定移除延伸選單，主按鈕改為「直接導向物件列表」的一鍵動作。
 * 兩個按鈕分別配上搜尋（放大鏡）／我要委託（剪貼板）圖示加強行為提示。
 */
export default function HeroCtaPanel({
  primaryText,
  primaryHref,
  secondaryText,
  secondaryHref,
}: Props) {
  return (
    <div className="mb-10 flex flex-wrap gap-3">
      <Link
        href={primaryHref}
        className="btn btn-primary inline-flex items-center gap-2 whitespace-nowrap"
      >
        <SearchGlyph />
        <span>{primaryText}</span>
      </Link>
      <Link
        href={secondaryHref}
        className="btn btn-secondary inline-flex items-center gap-2 whitespace-nowrap"
      >
        <ClipboardGlyph />
        <span>{secondaryText}</span>
      </Link>
    </div>
  );
}
