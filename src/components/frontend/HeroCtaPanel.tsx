import Link from 'next/link';

type Props = {
  primaryText: string;
  primaryHref: string;
  secondaryText: string;
  secondaryHref: string;
};

/**
 * Hero 區的 CTA 按鈕列。
 * 之前主按鈕是「展開→四個物件分類短連結」的兩段式互動，
 * 經產品決定移除延伸選單，主按鈕改為「直接導向物件列表」的一鍵動作。
 */
export default function HeroCtaPanel({
  primaryText,
  primaryHref,
  secondaryText,
  secondaryHref,
}: Props) {
  return (
    <div className="mb-10 flex flex-wrap gap-3">
      <Link href={primaryHref} className="btn btn-primary whitespace-nowrap">
        {primaryText}
      </Link>
      <Link href={secondaryHref} className="btn btn-secondary whitespace-nowrap">
        {secondaryText}
      </Link>
    </div>
  );
}
