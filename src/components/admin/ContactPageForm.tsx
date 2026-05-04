'use client';

import { useEffect, useState } from 'react';
import {
  CONTACT_DEFAULTS,
  type ContactAgent,
  type ContactContent,
  type ContactCompanyInfo,
} from '@/data/contact-defaults';

export default function ContactPageForm() {
  const [data, setData] = useState<ContactContent>(CONTACT_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/content?section=contact_page', { cache: 'no-store' });
        const json = await res.json();
        if (json?.data && typeof json.data === 'object') {
          setData({
            ...CONTACT_DEFAULTS,
            ...json.data,
            agents: Array.isArray(json.data.agents) && json.data.agents.length
              ? json.data.agents
              : CONTACT_DEFAULTS.agents,
            companyInfo: { ...CONTACT_DEFAULTS.companyInfo, ...(json.data.companyInfo || {}) },
          });
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function set<K extends keyof ContactContent>(key: K, value: ContactContent[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  function setCompany<K extends keyof ContactCompanyInfo>(key: K, value: ContactCompanyInfo[K]) {
    setData((d) => ({ ...d, companyInfo: { ...d.companyInfo, [key]: value } }));
  }

  // ===== Agents =====
  function updateAgent(i: number, patch: Partial<ContactAgent>) {
    setData((d) => ({
      ...d,
      agents: d.agents.map((a, idx) => (idx === i ? { ...a, ...patch } : a)),
    }));
  }
  function updateBullets(i: number, text: string) {
    const bullets = text.split('\n').map((s) => s.trim()).filter(Boolean);
    updateAgent(i, { bullets });
  }
  function addAgent() {
    setData((d) => ({
      ...d,
      agents: [
        ...d.agents,
        {
          initial: '新',
          badgeColor: 'green',
          name: '新業務專員',
          role: '租賃業務專員',
          bullets: [],
          phone: '',
          phoneTel: '',
          lineUrl: '',
          email: '',
        },
      ],
    }));
  }
  function removeAgent(i: number) {
    if (!confirm('確定要刪除這位業務？')) return;
    setData((d) => ({ ...d, agents: d.agents.filter((_, idx) => idx !== i) }));
  }
  function moveAgent(i: number, dir: -1 | 1) {
    const j = i + dir;
    setData((d) => {
      if (j < 0 || j >= d.agents.length) return d;
      const arr = [...d.agents];
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...d, agents: arr };
    });
  }
  async function uploadAgentAvatar(i: number, file: File) {
    setUploadingIdx(i);
    setMsg('');
    try {
      const fd = new FormData();
      fd.append('files', file);
      const res = await fetch('/api/upload?subdir=contact-agents', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || '上傳失敗');
      const url = json.files?.[0]?.url;
      if (!url) throw new Error('上傳失敗');
      updateAgent(i, { avatarUrl: url });
    } catch (e: any) {
      setMsg(e?.message || '上傳失敗');
    } finally {
      setUploadingIdx(null);
    }
  }

  async function save() {
    setSaving(true); setMsg('');
    try {
      const res = await fetch('/api/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'contact_page', data }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || '儲存失敗');
      }
      setMsg('已儲存 ✓');
      setTimeout(() => setMsg(''), 4000);
    } catch (e: any) {
      setMsg(e?.message || '儲存失敗');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-ink-500">載入中...</p>;

  return (
    <div className="space-y-5">
      {/* === Hero === */}
      <div className="admin-card">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-line">
          <h2 className="font-bold text-lg">頁面標題與副標</h2>
          <button onClick={save} disabled={saving} className="btn btn-primary text-sm">
            {saving ? '儲存中...' : '儲存全部'}
          </button>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label-base">小標籤（CONTACT US）</label>
            <input className="input-base" value={data.eyebrow} onChange={(e) => set('eyebrow', e.target.value)} />
          </div>
          <div>
            <label className="label-base">主標題</label>
            <input className="input-base" value={data.title} onChange={(e) => set('title', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="label-base">副標描述</label>
            <textarea
              className="input-base min-h-[60px]"
              value={data.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* === Agents === */}
      <div className="admin-card">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-line">
          <div>
            <h2 className="font-bold text-lg">業務團隊</h2>
            <p className="text-xs text-ink-500 mt-0.5">可選擇上傳頭像，或留空使用「初始字＋漸層底」</p>
          </div>
          <button onClick={addAgent} className="btn btn-secondary text-xs">+ 新增業務</button>
        </div>

        <div className="mb-4">
          <label className="label-base">區塊標題</label>
          <input className="input-base" value={data.agentsTitle} onChange={(e) => set('agentsTitle', e.target.value)} />
        </div>

        <div className="space-y-4">
          {data.agents.map((a, i) => (
            <div key={i} className="border border-line rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-ink-500">業務 #{i + 1}</h3>
                <div className="flex gap-1.5">
                  <button type="button" onClick={() => moveAgent(i, -1)} disabled={i === 0}
                    className="text-xs border border-line rounded-lg px-2.5 py-1 disabled:opacity-30 hover:border-brand-green-500">↑</button>
                  <button type="button" onClick={() => moveAgent(i, 1)} disabled={i === data.agents.length - 1}
                    className="text-xs border border-line rounded-lg px-2.5 py-1 disabled:opacity-30 hover:border-brand-green-500">↓</button>
                  <button type="button" onClick={() => removeAgent(i)}
                    className="text-xs border border-red-200 text-red-600 rounded-lg px-2.5 py-1 hover:bg-red-50">刪除</button>
                </div>
              </div>

              <div className="grid md:grid-cols-[120px_1fr] gap-4">
                {/* 頭像 / 初始字 */}
                <div>
                  <label className="text-xs font-bold text-ink-500">頭像</label>
                  {a.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.avatarUrl} alt="" className="w-full aspect-square rounded-2xl object-cover border border-line mt-1" />
                  ) : (
                    <div className={`w-full aspect-square rounded-2xl bg-gradient-to-br ${a.badgeColor === 'green' ? 'from-brand-green-700 to-brand-green-900' : 'from-brand-orange-500 to-brand-orange-700'} grid place-items-center text-3xl font-black text-white mt-1`}>
                      {a.initial || '?'}
                    </div>
                  )}
                  <label className={`mt-1.5 btn btn-secondary text-xs w-full cursor-pointer ${uploadingIdx === i ? 'opacity-60 pointer-events-none' : ''}`}>
                    {uploadingIdx === i ? '上傳中...' : (a.avatarUrl ? '更換頭像' : '上傳頭像')}
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => {
                        if (e.target.files?.[0]) uploadAgentAvatar(i, e.target.files[0]);
                        e.target.value = '';
                      }}
                    />
                  </label>
                  {a.avatarUrl && (
                    <button type="button" onClick={() => updateAgent(i, { avatarUrl: '' })}
                      className="text-xs text-ink-500 hover:text-red-600 mt-1 w-full text-center">
                      清除頭像
                    </button>
                  )}
                </div>

                {/* 文字欄位 */}
                <div className="space-y-2.5">
                  <div className="grid sm:grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs font-bold text-ink-500">初始字（無頭像時顯示）</label>
                      <input
                        className="input-base text-center font-black"
                        maxLength={2}
                        value={a.initial}
                        onChange={(e) => updateAgent(i, { initial: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-ink-500">底色（無頭像時）</label>
                      <select
                        className="input-base"
                        value={a.badgeColor}
                        onChange={(e) => updateAgent(i, { badgeColor: e.target.value as 'green' | 'orange' })}
                      >
                        <option value="green">綠色</option>
                        <option value="orange">橘色</option>
                      </select>
                    </div>
                    <div className="sm:col-span-1">
                      <label className="text-xs font-bold text-ink-500">姓名</label>
                      <input className="input-base" value={a.name} onChange={(e) => updateAgent(i, { name: e.target.value })} />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-ink-500">職稱</label>
                    <input className="input-base" value={a.role} onChange={(e) => updateAgent(i, { role: e.target.value })} placeholder="資深租賃業務專員" />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-ink-500">專業特色（每行一條，前台會以 ✓ 顯示）</label>
                    <textarea
                      className="input-base min-h-[70px]"
                      value={a.bullets.join('\n')}
                      onChange={(e) => updateBullets(i, e.target.value)}
                      placeholder={'專責住宅與電梯套房，台北・新北 10+ 年經驗\n中・英・日多語溝通服務'}
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-bold text-ink-500">顯示電話（如 0912-000-111）</label>
                      <input className="input-base" value={a.phone} onChange={(e) => updateAgent(i, { phone: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-ink-500">tel: 撥號連結（如 +886912000111）</label>
                      <input className="input-base font-mono text-sm" value={a.phoneTel} onChange={(e) => updateAgent(i, { phoneTel: e.target.value })} placeholder="留空則自動由顯示電話推算" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-ink-500">LINE 連結</label>
                      <input className="input-base" value={a.lineUrl} onChange={(e) => updateAgent(i, { lineUrl: e.target.value })} placeholder="https://lin.ee/..." />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-ink-500">Email</label>
                      <input type="email" className="input-base" value={a.email} onChange={(e) => updateAgent(i, { email: e.target.value })} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* === 公司資訊 === */}
      <div className="admin-card">
        <div className="mb-4 pb-3 border-b border-line">
          <h2 className="font-bold text-lg">公司資訊</h2>
          <p className="text-xs text-ink-500 mt-0.5">顯示在業務團隊區塊下方的灰色資訊框</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="label-base">區塊標題</label>
            <input className="input-base" value={data.companyInfoTitle} onChange={(e) => set('companyInfoTitle', e.target.value)} />
          </div>
          <div>
            <label className="label-base">公司名稱</label>
            <input className="input-base" value={data.companyInfo.companyName} onChange={(e) => setCompany('companyName', e.target.value)} />
          </div>
          <div>
            <label className="label-base">統一編號</label>
            <input className="input-base font-mono" value={data.companyInfo.businessId} onChange={(e) => setCompany('businessId', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="label-base">公司地址</label>
            <input className="input-base" value={data.companyInfo.address} onChange={(e) => setCompany('address', e.target.value)} />
          </div>
          <div>
            <label className="label-base">客服信箱</label>
            <input type="email" className="input-base" value={data.companyInfo.customerEmail} onChange={(e) => setCompany('customerEmail', e.target.value)} />
          </div>
          <div>
            <label className="label-base">服務時間</label>
            <input className="input-base" value={data.companyInfo.serviceHours} onChange={(e) => setCompany('serviceHours', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="label-base">服務範圍</label>
            <input className="input-base" value={data.companyInfo.serviceArea} onChange={(e) => setCompany('serviceArea', e.target.value)} />
          </div>
        </div>
      </div>

      {/* === 需求表單區塊 === */}
      <div className="admin-card">
        <div className="mb-4 pb-3 border-b border-line">
          <h2 className="font-bold text-lg">需求表單區塊文案</h2>
          <p className="text-xs text-ink-500 mt-0.5">右側填寫需求表的標題與按鈕文字</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label-base">表單標題</label>
            <input className="input-base" value={data.formTitle} onChange={(e) => set('formTitle', e.target.value)} />
          </div>
          <div>
            <label className="label-base">送出按鈕文字</label>
            <input className="input-base" value={data.formSubmitText} onChange={(e) => set('formSubmitText', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="label-base">送出按鈕下方備註</label>
            <input className="input-base" value={data.formNote} onChange={(e) => set('formNote', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="label-base">送出後成功訊息</label>
            <input className="input-base" value={data.formSuccessMessage} onChange={(e) => set('formSuccessMessage', e.target.value)} />
          </div>
        </div>
      </div>

      {/* === 底部固定送出列 === */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white border-t border-line px-4 py-3 z-20">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-3">
          {msg ? <p className="text-sm text-brand-green-700">{msg}</p> : <span />}
          <button type="button" onClick={save} disabled={saving} className="btn btn-primary">
            {saving ? '儲存中...' : '儲存全部變更'}
          </button>
        </div>
      </div>
      <div className="h-16" />
    </div>
  );
}
