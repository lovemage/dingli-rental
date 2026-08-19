'use client';

import { useSyncExternalStore } from 'react';
import {
  LINE_PREFILL_STORAGE_KEY,
  OFFICIAL_LINE_ID,
  OFFICIAL_LINE_QR_SRC,
  OFFICIAL_LINE_URL,
  buildOfficialLineMessageUrl,
} from '@/data/contact-defaults';

// 需求摘要在表單送出時就寫好了，之後不會再變動，所以不需要真的訂閱任何事件
const subscribeNoop = () => () => {};

function readPrefill() {
  try {
    return sessionStorage.getItem(LINE_PREFILL_STORAGE_KEY);
  } catch {
    // 無痕模式或封鎖 storage 時讀不到，退回純加好友連結
    return null;
  }
}

// 伺服器端與 hydration 當下一律當作沒有摘要，避免兩邊 render 結果不一致
const readPrefillOnServer = () => null;

/**
 * 表單送出成功後的官方 LINE 導引卡。
 *
 * 文案刻意固定以中／英／日三語並列呈現，不走 next-intl：外籍租客常直接
 * 瀏覽中文版頁面而不切語系，而「加官方 LINE 由專員確認物件」是後續聯繫的
 * 必經步驟，任何語系的訪客都必須看得懂。
 *
 * LINE 平台不允許網頁代替使用者加好友或代發訊息，只能提供連結與 QR code。
 * 若表單有留下需求摘要（sessionStorage），按鈕改用 oaMessage 連結：使用者加入
 * 好友後直接進聊天室，輸入框已帶好需求，按一次送出專員就收得到。
 *
 * flush：卡片是容器內第一個元素時用（如感謝頁），去掉與上方元素的間距。
 */
export default function LineFollowCard({ flush = false }: { flush?: boolean }) {
  const prefill = useSyncExternalStore(subscribeNoop, readPrefill, readPrefillOnServer);
  const hasPrefill = Boolean(prefill);
  const lineHref = prefill ? buildOfficialLineMessageUrl(prefill) : OFFICIAL_LINE_URL;

  return (
    <div
      className={`${flush ? '' : 'mt-6 '}rounded-xl border border-line bg-brand-green-50 p-5 text-left sm:p-6`}
    >
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
            href={lineHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-3 rounded-full bg-[#06C755] px-6 py-3 text-white shadow-sm transition hover:brightness-95"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/social-icons/LINE.svg" alt="" className="h-7 w-7 shrink-0 rounded-md bg-white p-0.5" />
            <span className="text-left leading-tight">
              <span className="block text-base font-extrabold">
                {hasPrefill ? '加入官方 LINE 並送出需求' : '加入官方 LINE'}
              </span>
              <span className="block text-xs font-bold opacity-90">Add LINE ・ LINEを追加</span>
            </span>
          </a>

          {hasPrefill && (
            <p className="mt-3 rounded-lg bg-white/70 px-3 py-2 text-xs font-bold leading-6 text-brand-green-900">
              加入後聊天室會自動帶入您剛填的需求，按一下「送出」專員就收得到。
              <br />
              Your request is pre-filled in the chat — just tap send.
              <br />
              チャットにご要望が入力済みです。送信ボタンを押すだけです。
            </p>
          )}

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
