import { OFFICIAL_LINE_ID, OFFICIAL_LINE_QR_SRC, OFFICIAL_LINE_URL } from '@/data/contact-defaults';

/**
 * 表單送出成功後的官方 LINE 導引卡。
 *
 * 文案刻意固定以中／英／日三語並列呈現，不走 next-intl：外籍租客常直接
 * 瀏覽中文版頁面而不切語系，而「加官方 LINE 由專員確認物件」是後續聯繫的
 * 必經步驟，任何語系的訪客都必須看得懂。
 *
 * LINE 平台不允許網頁代替使用者加好友，只能提供加好友連結與 QR code，
 * 由使用者點擊或掃描完成（點擊屬使用者手勢，不會被瀏覽器攔擋）。
 */
export default function LineFollowCard() {
  return (
    <div className="mt-6 rounded-xl border border-line bg-brand-green-50 p-5 text-left sm:p-6">
      <h3 className="text-lg font-black leading-snug text-brand-green-900">
        加入官方 LINE，由專員與您確認物件
      </h3>
      <p className="mt-1.5 text-sm font-semibold leading-6 text-ink-700">
        Add our official LINE — an agent will confirm the property with you.
      </p>
      <p className="mt-1 text-sm font-semibold leading-6 text-ink-700">
        公式LINEを追加してください。担当者が物件の詳細をご確認します。
      </p>

      <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row sm:items-start">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={OFFICIAL_LINE_QR_SRC}
          alt="鼎立房屋官方 LINE QR code / Official LINE QR code / 公式LINE QRコード"
          width={160}
          height={160}
          className="h-40 w-40 shrink-0 rounded-lg border border-line bg-white p-2"
        />

        <div className="w-full flex-1">
          <a
            href={OFFICIAL_LINE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-3 rounded-full bg-[#06C755] px-6 py-3 text-white shadow-sm transition hover:brightness-95"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/social-icons/LINE.svg" alt="" className="h-7 w-7 shrink-0 rounded-md bg-white p-0.5" />
            <span className="text-left leading-tight">
              <span className="block text-base font-extrabold">加入官方 LINE</span>
              <span className="block text-xs font-bold opacity-90">Add LINE ・ LINEを追加</span>
            </span>
          </a>

          <p className="mt-3 text-xs leading-6 text-ink-500">
            手機請點上方按鈕，電腦請以 LINE 掃描 QR code。
            <br />
            On mobile tap the button; on desktop scan the QR code with LINE.
            <br />
            スマホはボタン、パソコンはQRコードから追加してください。
          </p>

          <p className="mt-2 text-sm font-bold text-ink-700">
            LINE ID：{OFFICIAL_LINE_ID}
          </p>
        </div>
      </div>
    </div>
  );
}
