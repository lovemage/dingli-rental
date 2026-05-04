'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type Message = { role: 'user' | 'assistant'; content: string };

type Props = {
  /** 觸發按鈕的 className（外層由父層控制風格與位置） */
  triggerClassName?: string;
  /** 觸發按鈕內容（可放文字或 ReactNode） */
  triggerLabel?: React.ReactNode;
};

const GREETING: Message = {
  role: 'assistant',
  content: '您好，我是鼎力 AI，協助您找到最適合的物件。\n\n請告訴我您的需求，例如：\n• 想找哪個地區？（台北市、新北市…）\n• 預算範圍？\n• 房型偏好？（套房／兩房／整層住家…）\n• 有特別需求嗎？（寵物、電梯、近捷運…）',
};

export default function AiChatWidget({ triggerClassName, triggerLabel = '鼎力 AI' }: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [lineUrl, setLineUrl] = useState('https://lin.ee/z9d5558');
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // 確保 portal 只在 client hydrate 後才渲染（SSR safe）
  useEffect(() => { setMounted(true); }, []);

  // 訊息更新時自動捲到底
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending]);

  // 開啟時鎖背景捲動
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setError('');
    const newHistory: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(newHistory);
    setInput('');
    setSending(true);

    try {
      // API 只需要 user/assistant 訊息（不含我們前端展示用的 greeting）
      const apiMessages = newHistory.filter((_, i) => i > 0);
      // 補上首則 greeting 作為 assistant，讓 AI 有 context 知道對話由它開頭
      const payloadMessages: Message[] = [
        { role: 'assistant', content: GREETING.content },
        ...apiMessages,
      ];

      const res = await fetch('/api/customer-service/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: payloadMessages }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || '客服無法回應');
      if (json.lineUrl) setLineUrl(json.lineUrl);
      setMessages([...newHistory, { role: 'assistant', content: json.reply }]);
    } catch (e: any) {
      setError(e?.message || '送出失敗');
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  const modal = open && (
        <div
          className="fixed inset-0 z-[55] bg-ink-900/60 backdrop-blur-sm sm:grid sm:place-items-end sm:justify-end sm:p-6"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white w-full h-full sm:w-[420px] sm:h-[640px] sm:max-h-[calc(100vh-3rem)] sm:rounded-2xl shadow-2xl border border-line flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-brand-green-700 to-brand-green-900 text-white px-5 py-3.5 flex items-center justify-between flex-shrink-0">
              <div>
                <p className="text-[11px] opacity-80 tracking-wider">DINGLI · AI ASSISTANT</p>
                <h3 className="font-extrabold">鼎力 AI</h3>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-8 h-8 grid place-items-center rounded-full hover:bg-white/15 transition text-xl"
                aria-label="關閉"
              >
                ✕
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-paper">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                      m.role === 'user'
                        ? 'bg-brand-green-700 text-white rounded-br-sm'
                        : 'bg-white border border-line text-ink-900 rounded-bl-sm shadow-sm'
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="bg-white border border-line rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm">
                    <span className="inline-flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-ink-300 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-ink-300 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-ink-300 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  </div>
                </div>
              )}
              {error && (
                <p className="text-xs text-red-600 text-center bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
            </div>

            {/* LINE button */}
            <a
              href={lineUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#06C755] hover:bg-[#05b34c] text-white text-sm font-bold py-2.5 text-center transition flex-shrink-0 flex items-center justify-center gap-2"
            >
              <span className="inline-grid place-items-center w-5 h-5 rounded bg-white text-[#06C755] text-[10px] font-black leading-none">
                LINE
              </span>
              直接與業務專員對話
            </a>

            {/* Input */}
            <div className="border-t border-line bg-white p-3 flex-shrink-0">
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  rows={1}
                  maxLength={500}
                  disabled={sending}
                  placeholder="輸入訊息（Enter 送出，Shift+Enter 換行）"
                  className="input-base !text-sm resize-none flex-1 max-h-32"
                />
                <button
                  type="button"
                  onClick={send}
                  disabled={sending || !input.trim()}
                  className="btn btn-primary text-sm whitespace-nowrap disabled:opacity-50"
                >
                  送出
                </button>
              </div>
              <p className="text-[10px] text-ink-300 mt-1 text-center">
                AI 回覆僅供參考，實際細節請聯繫業務專員
              </p>
            </div>
          </div>
        </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={triggerClassName || 'btn btn-secondary'}
      >
        {triggerLabel}
      </button>
      {/* Portal 到 body 跳出任何 backdrop-filter / transform 造成的 containing block */}
      {mounted && modal && createPortal(modal, document.body)}
    </>
  );
}
