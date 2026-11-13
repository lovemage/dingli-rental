/**
 * 首頁主視覺標題（前台與後台預覽共用，確保換行結果一模一樣）
 * - 後台輸入的換行（Enter）原樣換行
 * - 中文只在「空白」或換行處斷行（keep-all），整句放不下時才逐字斷行，避免單字落到下一行
 */
type Size = 'responsive' | 'desktop' | 'mobile';

const SIZE_CLASS: Record<'zh' | 'other', Record<Size, string>> = {
  zh: {
    responsive: 'text-4xl md:text-5xl lg:text-[56px]',
    desktop: 'text-[56px]',
    mobile: 'text-4xl',
  },
  other: {
    responsive: 'text-3xl md:text-4xl lg:text-5xl',
    desktop: 'text-5xl',
    mobile: 'text-3xl',
  },
};

export default function HeroTitle({
  line1,
  line2,
  locale,
  size = 'responsive',
}: {
  line1: string;
  line2: string;
  locale: string;
  size?: Size;
}) {
  const isZh = locale === 'zh';
  return (
    <h1
      className={`${SIZE_CLASS[isZh ? 'zh' : 'other'][size]} font-black leading-tight my-5 text-paper whitespace-pre-line [word-break:keep-all] [overflow-wrap:anywhere] drop-shadow-[0_2px_18px_rgba(26,36,33,0.35)]`}
    >
      {/* zh 強制兩行；EN/JA 以自然換行維持按鈕可見。 */}
      {line1.trim()}
      {isZh ? <br /> : ' '}
      <span className="text-brand-orange-300 relative inline-block">
        {line2.trim()}
        <span className="absolute left-0 right-0 bottom-1 h-3.5 bg-brand-green-900/55 -z-10 rounded" />
      </span>
    </h1>
  );
}
