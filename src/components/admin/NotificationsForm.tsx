'use client';

import { useEffect, useState } from 'react';
import MaterialIcon from '@/components/admin/MaterialIcon';

export default function NotificationsForm() {
  const [enabled, setEnabled] = useState(false);
  const [token, setToken] = useState('');
  const [tokenMasked, setTokenMasked] = useState('');
  const [tokenConfigured, setTokenConfigured] = useState(false);
  const [chatId, setChatId] = useState('');
  const [chatIdMasked, setChatIdMasked] = useState('');
  const [chatIdConfigured, setChatIdConfigured] = useState(false);
  const [showToken, setShowToken] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/notifications', { cache: 'no-store' });
        const json = await res.json();
        if (res.ok) {
          setEnabled(Boolean(json.telegramEnabled));
          setTokenMasked(json.telegramTokenMasked || '');
          setTokenConfigured(Boolean(json.telegramTokenConfigured));
          setChatIdMasked(json.telegramChatIdMasked || '');
          setChatIdConfigured(Boolean(json.telegramChatIdConfigured));
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function save() {
    setSaving(true); setMsg(null);
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramEnabled: enabled,
          telegramBotToken: token,    // 空字串 = 保留原值
          telegramChatId: chatId,     // 空字串 = 保留原值
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || '儲存失敗');
      setToken('');
      setChatId('');
      setTokenMasked(json.telegramTokenMasked || '');
      setTokenConfigured(Boolean(json.telegramTokenConfigured));
      setChatIdMasked(json.telegramChatIdMasked || '');
      setChatIdConfigured(Boolean(json.telegramChatIdConfigured));
      setMsg({ type: 'ok', text: '已儲存 ✓' });
    } catch (e: any) {
      setMsg({ type: 'err', text: e?.message || '儲存失敗' });
    } finally {
      setSaving(false);
    }
  }

  async function sendTest() {
    setTesting(true); setMsg(null);
    try {
      const res = await fetch('/api/admin/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramBotToken: token,
          telegramChatId: chatId,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || '送出失敗');
      setMsg({ type: 'ok', text: '✓ 測試訊息已送出，請至 Telegram 確認' });
    } catch (e: any) {
      setMsg({ type: 'err', text: e?.message || '送出失敗' });
    } finally {
      setTesting(false);
    }
  }

  if (loading) return <p className="text-ink-500">載入中...</p>;

  return (
    <div className="space-y-5">
      {/* === 設定區 === */}
      <div className="admin-card">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-line">
          <div>
            <h2 className="font-bold text-lg flex items-center gap-2">
              <span className="inline-grid place-items-center w-7 h-7 rounded-md bg-[#229ED9] text-white text-sm font-black">T</span>
              Telegram 通知
            </h2>
            <p className="text-xs text-ink-500 mt-0.5">
              新客戶詢問送出時即時推播到你指定的 Telegram。
            </p>
          </div>
          <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="font-bold">{enabled ? '已啟用' : '停用中'}</span>
          </label>
        </div>

        <div className="space-y-4">
          {/* Bot Token */}
          <div>
            <label className="label-base flex items-center justify-between">
              <span>Bot API Token</span>
              {tokenConfigured && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-brand-green-50 text-brand-green-700">
                  ✓ 已設定 ({tokenMasked})
                </span>
              )}
            </label>
            <div className="flex gap-2">
              <input
                type={showToken ? 'text' : 'password'}
                className="input-base font-mono text-sm flex-1"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder={tokenConfigured ? '留空 = 保留原 token' : '123456789:ABCdef-XXXXXXXXXXXXXXXXXXXXXXXXXXX'}
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowToken((s) => !s)}
                className="btn btn-secondary text-xs whitespace-nowrap">
                {showToken ? '隱藏' : '顯示'}
              </button>
            </div>
          </div>

          {/* Chat ID */}
          <div>
            <label className="label-base flex items-center justify-between">
              <span>Chat ID</span>
              {chatIdConfigured && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-brand-green-50 text-brand-green-700">
                  ✓ 已設定 ({chatIdMasked})
                </span>
              )}
            </label>
            <input
              className="input-base font-mono text-sm"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              placeholder={chatIdConfigured ? '留空 = 保留原 chat ID' : '個人：123456789；群組：-1001234567890'}
            />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-3 border-t border-line">
            <button type="button" onClick={save} disabled={saving} className="btn btn-primary">
              {saving ? '儲存中...' : '儲存設定'}
            </button>
            <button type="button" onClick={sendTest} disabled={testing}
              className="btn btn-secondary disabled:opacity-50">
              <MaterialIcon name="send" className="!text-base mr-1" />
              {testing ? '測試送出中...' : '送出測試訊息'}
            </button>
          </div>

          {msg && (
            <p className={`text-sm ${msg.type === 'ok' ? 'text-brand-green-700' : 'text-red-600'}`}>
              {msg.text}
            </p>
          )}
        </div>
      </div>

      {/* === 教學 === */}
      <div className="admin-card bg-paper-2/40">
        <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
          <MaterialIcon name="school" className="!text-2xl text-brand-orange-700" />
          如何取得 Token 與 Chat ID
        </h3>

        <Step n={1} title="建立 Telegram Bot 並取得 Token">
          <ol className="list-decimal list-inside space-y-1.5 text-sm text-ink-700">
            <li>打開 Telegram，搜尋 <code className="bg-white px-1.5 py-0.5 rounded font-mono">@BotFather</code> 並開始對話</li>
            <li>傳送指令 <code className="bg-white px-1.5 py-0.5 rounded font-mono">/newbot</code></li>
            <li>依 BotFather 指示輸入 bot 顯示名稱（中文 OK，例：<em>鼎立通知 Bot</em>）</li>
            <li>再輸入 bot username（必須英文，結尾 <code className="bg-white px-1 rounded">_bot</code>，例：<em>dingli_notify_bot</em>）</li>
            <li>BotFather 會回傳一段 <code className="bg-white px-1 rounded font-mono">123456789:ABCdef...</code> 格式的 token，整段貼到上面「Bot API Token」</li>
          </ol>
        </Step>

        <Step n={2} title="取得 Chat ID（個人通知）">
          <ol className="list-decimal list-inside space-y-1.5 text-sm text-ink-700">
            <li>在 Telegram 搜尋你剛建立的 bot（按 username 找）</li>
            <li>點進 bot 對話框，按「開始」或傳送任何文字（例：<em>hi</em>）</li>
            <li>瀏覽器打開：<br />
              <code className="bg-white px-1.5 py-0.5 rounded font-mono text-xs break-all">https://api.telegram.org/bot&lt;你的TOKEN&gt;/getUpdates</code></li>
            <li>找回應裡 <code className="bg-white px-1 rounded font-mono">&quot;chat&quot;:&#123;&quot;id&quot;:<b>123456789</b>&#125;</code> 的數字，貼到上面「Chat ID」</li>
            <li className="text-ink-500">
              懶人版：直接搜尋 <code className="bg-white px-1 rounded">@userinfobot</code>，按開始就會回傳你的 chat ID。
            </li>
          </ol>
        </Step>

        <Step n={3} title="改用群組通知（選用）" last>
          <ol className="list-decimal list-inside space-y-1.5 text-sm text-ink-700">
            <li>建一個 Telegram 群組，把多位業務同事拉進來</li>
            <li>把上面建的 bot 加入群組（搜尋 username 邀請）</li>
            <li>在群組傳一則訊息，例：<em>/start</em></li>
            <li>同樣打開 <code className="bg-white px-1 rounded font-mono text-xs">/getUpdates</code> 找 chat id（群組是負數，例：<code className="bg-white px-1 rounded font-mono">-1001234567890</code>），貼上去</li>
            <li>群組所有人都會收到通知，比個人通知更適合多業務協作</li>
          </ol>
        </Step>

        <p className="text-xs text-ink-500 mt-4">
          ✓ 設定完成後按「送出測試訊息」確認；確認 OK 再勾選「啟用」並儲存。
          往後每筆 <code className="bg-white px-1 rounded">/contact</code> 表單送出都會即時通知。
        </p>
      </div>
    </div>
  );
}

function Step({
  n,
  title,
  children,
  last,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div className={`flex gap-3 ${last ? '' : 'mb-5'}`}>
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-orange-700 text-white grid place-items-center text-sm font-black">
        {n}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-sm mb-1.5">{title}</h4>
        {children}
      </div>
    </div>
  );
}
