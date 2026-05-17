'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type Message = { role: 'user' | 'assistant'; content: string };

type Language = {
  code: 'zh' | 'en' | 'ja' | 'vi' | 'th' | 'id';
  label: string;       // 顯示名稱（用該語言寫）
  flag: string;        // emoji 旗
  greeting: string;    // AI 開場白
  inputPlaceholder: string;
  sendLabel: string;
  pickerHint: string;  // 顯示在語言選擇器上方
};

const LANGUAGES: Language[] = [
  {
    code: 'zh',
    label: '中文',
    flag: '🇹🇼',
    greeting:
      '您好，我是鼎立 AI，協助您找到最適合的物件。\n\n請告訴我您的需求，例如：\n• 想找哪個地區？（台北市、新北市…）\n• 預算範圍？\n• 房型偏好？（套房／兩房／整層住家…）\n• 有特別需求嗎？（寵物、電梯、近捷運…）',
    inputPlaceholder: '輸入訊息（Enter 送出，Shift+Enter 換行）',
    sendLabel: '送出',
    pickerHint: '請選擇您慣用的語言',
  },
  {
    code: 'en',
    label: 'English',
    flag: '🇺🇸',
    greeting:
      "Hello! I'm Dingli AI — your real estate assistant. I'll help you find the perfect property in northern Taiwan.\n\nPlease tell me:\n• Preferred area? (Taipei, New Taipei, Keelung, Taoyuan, Hsinchu)\n• Budget range?\n• Property type? (studio, 2-bedroom, whole apartment...)\n• Special needs? (elevator, pet-friendly, near MRT...)",
    inputPlaceholder: 'Type your message (Enter to send, Shift+Enter for new line)',
    sendLabel: 'Send',
    pickerHint: 'Please choose your preferred language',
  },
  {
    code: 'ja',
    label: '日本語',
    flag: '🇯🇵',
    greeting:
      'こんにちは。鼎立AI、不動産アシスタントです。北部台湾でぴったりの物件をお探しします。\n\nご希望をお聞かせください：\n• ご希望のエリア？（台北、新北、桃園）\n• ご予算は？\n• 部屋タイプは？（ワンルーム、2LDK、一棟…）\n• 特別なご要望は？（エレベーター、ペット可、MRT近く…）',
    inputPlaceholder: 'メッセージを入力（Enter で送信、Shift+Enter で改行）',
    sendLabel: '送信',
    pickerHint: 'ご希望の言語をお選びください',
  },
  {
    code: 'vi',
    label: 'Tiếng Việt',
    flag: '🇻🇳',
    greeting:
      'Xin chào! Tôi là Dingli AI — trợ lý bất động sản. Tôi sẽ giúp bạn tìm được căn nhà ưng ý ở miền Bắc Đài Loan.\n\nVui lòng cho tôi biết:\n• Khu vực mong muốn? (Đài Bắc, Tân Bắc, Cơ Long, Đào Viên, Tân Trúc)\n• Ngân sách của bạn?\n• Loại nhà? (studio, 2 phòng ngủ, nguyên căn...)\n• Yêu cầu đặc biệt? (thang máy, được nuôi thú, gần MRT...)',
    inputPlaceholder: 'Nhập tin nhắn (Enter để gửi, Shift+Enter để xuống dòng)',
    sendLabel: 'Gửi',
    pickerHint: 'Vui lòng chọn ngôn ngữ',
  },
  {
    code: 'th',
    label: 'ภาษาไทย',
    flag: '🇹🇭',
    greeting:
      'สวัสดีค่ะ ฉันคือ Dingli AI ผู้ช่วยอสังหาริมทรัพย์ของคุณ จะช่วยคุณหาที่พักที่เหมาะสมในไต้หวันตอนเหนือ\n\nกรุณาบอก:\n• พื้นที่ที่ต้องการ? (ไทเป, นิวไทเป, จีหลง, เถาหยวน, ซินจู๋)\n• งบประมาณของคุณ?\n• ประเภทห้อง? (สตูดิโอ, 2 ห้องนอน, ทั้งห้องชุด...)\n• ความต้องการพิเศษ? (มีลิฟต์, เลี้ยงสัตว์ได้, ใกล้ MRT...)',
    inputPlaceholder: 'พิมพ์ข้อความ (Enter เพื่อส่ง, Shift+Enter ขึ้นบรรทัดใหม่)',
    sendLabel: 'ส่ง',
    pickerHint: 'กรุณาเลือกภาษา',
  },
  {
    code: 'id',
    label: 'Bahasa Indonesia',
    flag: '🇮🇩',
    greeting:
      'Halo! Saya Dingli AI — asisten properti Anda. Saya akan membantu menemukan tempat tinggal yang sesuai di Taiwan Utara.\n\nMohon beritahu:\n• Daerah yang diinginkan? (Taipei, New Taipei, Keelung, Taoyuan, Hsinchu)\n• Kisaran budget Anda?\n• Jenis hunian? (studio, 2 kamar, satu unit penuh...)\n• Kebutuhan khusus? (lift, ramah hewan, dekat MRT...)',
    inputPlaceholder: 'Ketik pesan (Enter untuk kirim, Shift+Enter untuk baris baru)',
    sendLabel: 'Kirim',
    pickerHint: 'Silakan pilih bahasa',
  },
];

// 「直接與業務專員對話」的多語版本
const LINE_BTN_LABEL: Record<Language['code'], string> = {
  zh: '直接與業務專員對話',
  en: 'Chat with our agent on LINE',
  ja: 'LINEで担当者と直接話す',
  vi: 'Trò chuyện trực tiếp với chuyên viên trên LINE',
  th: 'สนทนากับพนักงานโดยตรงผ่าน LINE',
  id: 'Bicara langsung dengan agen kami di LINE',
};

const FOOTER_DISCLAIMER: Record<Language['code'], string> = {
  zh: 'AI 回覆僅供參考，實際細節請聯繫業務專員',
  en: 'AI responses are for reference only — please contact our agent for details',
  ja: 'AIの回答は参考用です。詳細は担当者にお問い合わせください',
  vi: 'Phản hồi của AI chỉ mang tính tham khảo — vui lòng liên hệ chuyên viên để biết chi tiết',
  th: 'คำตอบจาก AI เป็นเพียงข้อมูลอ้างอิง โปรดติดต่อพนักงานเพื่อรายละเอียด',
  id: 'Jawaban AI hanya sebagai referensi — silakan hubungi agen kami untuk detail',
};

const CLOSE_LABEL: Record<Language['code'], string> = {
  zh: '關閉', en: 'Close', ja: '閉じる', vi: 'Đóng', th: 'ปิด', id: 'Tutup',
};

const CHANGE_LANG_LABEL: Record<Language['code'], string> = {
  zh: '切換語言', en: 'Switch language', ja: '言語切替',
  vi: 'Đổi ngôn ngữ', th: 'เปลี่ยนภาษา', id: 'Ganti bahasa',
};

type Props = {
  triggerClassName?: string;
  triggerLabel?: React.ReactNode;
};

export default function AiChatWidget({ triggerClassName, triggerLabel = '鼎立 AI' }: Props) {
  const [open, setOpen] = useState(false);
  const [language, setLanguage] = useState<Language | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [lineUrl, setLineUrl] = useState('https://lin.ee/z9d5558');
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  function pickLanguage(lang: Language) {
    setLanguage(lang);
    setMessages([{ role: 'assistant', content: lang.greeting }]);
    setError('');
  }

  function resetToLanguagePicker() {
    setLanguage(null);
    setMessages([]);
    setInput('');
    setError('');
  }

  async function send() {
    if (!language) return;
    const text = input.trim();
    if (!text || sending) return;
    setError('');
    const newHistory: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(newHistory);
    setInput('');
    setSending(true);

    try {
      const res = await fetch('/api/customer-service/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory,
          language: language.code,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Service unavailable');
      if (json.lineUrl) setLineUrl(json.lineUrl);
      setMessages([...newHistory, { role: 'assistant', content: json.reply }]);
    } catch (e: any) {
      setError(e?.message || 'Send failed');
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

  const modal = open && typeof document !== 'undefined' && (
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
          <div className="min-w-0 flex-1">
            <p className="text-[11px] opacity-80 tracking-wider">DINGLI · AI ASSISTANT</p>
            <h3 className="font-extrabold">鼎立 AI</h3>
          </div>
          {language && (
            <button
              type="button"
              onClick={resetToLanguagePicker}
              className="mr-2 text-xs px-2.5 py-1 rounded-full bg-white/15 hover:bg-white/25 transition flex items-center gap-1"
              aria-label={CHANGE_LANG_LABEL[language.code]}
              title={CHANGE_LANG_LABEL[language.code]}
            >
              <span aria-hidden>{language.flag}</span>
              <span className="hidden sm:inline">{language.label}</span>
              <span className="text-white/70" aria-hidden>↻</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-8 h-8 grid place-items-center rounded-full hover:bg-white/15 transition text-xl flex-shrink-0"
            aria-label={language ? CLOSE_LABEL[language.code] : 'Close'}
          >
            ✕
          </button>
        </div>

        {/* Body 1：未選語言 → 顯示語言選擇器 */}
        {!language ? (
          <div className="flex-1 overflow-y-auto bg-paper px-5 py-8 flex flex-col">
            <div className="text-center mb-6">
              <p className="text-sm text-ink-500 mb-1">Welcome / 歡迎 / ようこそ</p>
              <h4 className="text-xl font-extrabold text-ink-900">Please choose your language</h4>
              <p className="text-sm text-ink-500 mt-1">請選擇您慣用的語言</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => pickLanguage(lang)}
                  className="flex flex-col items-center gap-2 px-3 py-4 rounded-xl border-2 border-line bg-white hover:border-brand-green-700 hover:bg-brand-green-50 active:scale-95 transition"
                >
                  <span className="text-3xl leading-none" aria-hidden>{lang.flag}</span>
                  <span className="font-bold text-sm text-ink-900">{lang.label}</span>
                </button>
              ))}
            </div>
            <p className="text-center text-xs text-ink-400 mt-auto pt-6">
              鼎立租售管理 · Dingli Rental Service
            </p>
          </div>
        ) : (
          <>
            {/* Body 2：已選語言 → 對話 UI */}
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
                    {m.role === 'assistant' ? renderRichText(m.content) : m.content}
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
              {LINE_BTN_LABEL[language.code]}
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
                  placeholder={language.inputPlaceholder}
                  className="input-base !text-sm resize-none flex-1 max-h-32"
                />
                <button
                  type="button"
                  onClick={send}
                  disabled={sending || !input.trim()}
                  className="btn btn-primary text-sm whitespace-nowrap disabled:opacity-50"
                >
                  {language.sendLabel}
                </button>
              </div>
              <p className="text-[10px] text-ink-300 mt-1 text-center">
                {FOOTER_DISCLAIMER[language.code]}
              </p>
            </div>
          </>
        )}
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
      {modal && createPortal(modal, document.body)}
    </>
  );
}

// ===== AI 訊息富文字渲染：把 URL 與 [text](url) 轉成可點按鈕 =====
type Token =
  | { type: 'text'; content: string }
  | { type: 'link'; text: string; url: string };

function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  // 同時匹配 markdown link [text](url) 與裸 URL
  const re = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s<>"')]+)/g;
  // 尾隨標點（中英）— 不應算進 URL，要還回 text
  const trailingPunct = /[.,;:!?。，、；：！？「」)\]]+$/;
  let lastIdx = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > lastIdx) tokens.push({ type: 'text', content: text.slice(lastIdx, m.index) });
    if (m[1] && m[2]) {
      tokens.push({ type: 'link', text: m[1], url: m[2] });
    } else if (m[3]) {
      let url = m[3];
      const tp = url.match(trailingPunct);
      if (tp) {
        url = url.slice(0, -tp[0].length);
        re.lastIndex -= tp[0].length; // 讓尾隨標點回到 text 流
      }
      tokens.push({ type: 'link', text: url, url });
    }
    lastIdx = re.lastIndex;
  }
  if (lastIdx < text.length) tokens.push({ type: 'text', content: text.slice(lastIdx) });
  return tokens;
}

function classifyLink(url: string): { kind: 'line' | 'property' | 'other'; label: string } {
  if (/lin\.ee|line\.me/i.test(url)) return { kind: 'line', label: 'LINE 諮詢' };
  const propMatch = url.match(/\/properties\/(\d+)/);
  if (propMatch) return { kind: 'property', label: `查看物件 #${propMatch[1]}` };
  return { kind: 'other', label: url.replace(/^https?:\/\//, '').replace(/\/$/, '') };
}

function renderRichText(content: string): React.ReactNode {
  const tokens = tokenize(content);
  return tokens.map((t, i) => {
    if (t.type === 'text') return <span key={i}>{t.content}</span>;
    const { kind, label } = classifyLink(t.url);
    const display = t.text === t.url ? label : t.text;
    if (kind === 'line') {
      return (
        <a
          key={i}
          href={t.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 mx-0.5 my-1 px-3 py-1.5 rounded-full bg-[#06C755] hover:bg-[#05b34c] text-white text-xs font-bold transition no-underline"
        >
          <span className="inline-grid place-items-center w-4 h-4 rounded bg-white text-[#06C755] text-[9px] font-black leading-none">L</span>
          {display}
        </a>
      );
    }
    if (kind === 'property') {
      return (
        <a
          key={i}
          href={t.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mx-0.5 my-1 px-3 py-1.5 rounded-full bg-brand-orange-50 hover:bg-brand-orange-100 text-brand-orange-700 border border-brand-orange-300 text-xs font-bold transition no-underline"
        >
          {display}
          <span aria-hidden>→</span>
        </a>
      );
    }
    return (
      <a
        key={i}
        href={t.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 mx-0.5 my-1 px-2.5 py-1 rounded-full bg-paper-2 hover:bg-brand-green-50 text-brand-green-700 border border-line text-xs font-bold transition no-underline"
      >
        {display}
        <span aria-hidden>↗</span>
      </a>
    );
  });
}
