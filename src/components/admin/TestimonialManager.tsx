'use client';

import { useEffect, useState } from 'react';

type Testimonial = {
  name: string;
  role: string;
  quote: string;
};

type AboutData = Record<string, unknown> & {
  testimonials?: Testimonial[];
};

const EMPTY_ROW: Testimonial = { name: '', role: '', quote: '' };

export default function TestimonialManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [data, setData] = useState<AboutData>({});
  const [rows, setRows] = useState<Testimonial[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/content?section=about');
        const json = await res.json();
        const about = (json?.data || {}) as AboutData;
        const testimonials = Array.isArray(about.testimonials)
          ? about.testimonials.filter(
              (t): t is Testimonial =>
                !!t &&
                typeof t === 'object' &&
                typeof t.name === 'string' &&
                typeof t.role === 'string' &&
                typeof t.quote === 'string'
            )
          : [];
        setData(about);
        setRows(testimonials);
      } catch {
        setMsg('載入失敗，請稍後再試');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function update(idx: number, patch: Partial<Testimonial>) {
    setRows((s) => s.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  }

  function addRow() {
    setRows((s) => [...s, { ...EMPTY_ROW }]);
  }

  function removeRow(idx: number) {
    setRows((s) => s.filter((_, i) => i !== idx));
  }

  function moveRow(idx: number, dir: -1 | 1) {
    const to = idx + dir;
    if (to < 0 || to >= rows.length) return;
    setRows((s) => {
      const next = [...s];
      [next[idx], next[to]] = [next[to], next[idx]];
      return next;
    });
  }

  async function save() {
    setSaving(true);
    setMsg('');
    const sanitized = rows
      .map((r) => ({
        name: r.name.trim(),
        role: r.role.trim(),
        quote: r.quote.trim(),
      }))
      .filter((r) => r.name && r.role && r.quote);

    try {
      const res = await fetch('/api/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'about',
          data: {
            ...data,
            testimonials: sanitized,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || '儲存失敗');
      setData((prev) => ({ ...prev, testimonials: sanitized }));
      setRows(sanitized);
      setMsg('已儲存 ✓');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '儲存失敗';
      setMsg(message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-ink-500">載入中...</p>;

  return (
    <div className="space-y-4 pb-20">
      <div className="admin-card !p-4 sm:!p-5">
        <div className="flex items-center justify-between gap-3 mb-3 pb-2 border-b border-line">
          <h2 className="font-bold text-lg">首頁評論（{rows.length}）</h2>
          <button type="button" onClick={addRow} className="btn btn-primary text-sm px-4 py-2">
            新增評論
          </button>
        </div>

        {rows.length === 0 ? (
          <p className="text-sm text-ink-500">目前沒有評論，請點右上角新增。</p>
        ) : (
          <div className="space-y-3">
            {rows.map((row, idx) => (
              <div key={`${idx}-${row.name}-${row.role}`} className="border border-line rounded-lg p-3 space-y-2.5">
                <div className="grid sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="label-base mb-1">姓名</label>
                    <input
                      className="input-base !py-2"
                      value={row.name}
                      onChange={(e) => update(idx, { name: e.target.value })}
                      placeholder="例如：陳小姐"
                    />
                  </div>
                  <div>
                    <label className="label-base mb-1">身份 / 職稱</label>
                    <input
                      className="input-base !py-2"
                      value={row.role}
                      onChange={(e) => update(idx, { role: e.target.value })}
                      placeholder="例如：外商行銷經理"
                    />
                  </div>
                </div>
                <div>
                  <label className="label-base mb-1">評論內容</label>
                  <textarea
                    className="input-base min-h-[90px]"
                    value={row.quote}
                    onChange={(e) => update(idx, { quote: e.target.value })}
                    placeholder="請輸入評論內容"
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button type="button" onClick={() => moveRow(idx, -1)} disabled={idx === 0} className="btn btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">
                    上移
                  </button>
                  <button type="button" onClick={() => moveRow(idx, 1)} disabled={idx === rows.length - 1} className="btn btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">
                    下移
                  </button>
                  <button type="button" onClick={() => removeRow(idx)} className="border border-red-200 text-red-700 rounded-full px-3 py-1.5 text-xs hover:bg-red-50">
                    刪除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white border-t border-line px-4 py-2.5 z-20">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-2">
          <p className="text-xs">{msg}</p>
          <button type="button" onClick={save} disabled={saving} className="btn btn-primary text-sm px-4 py-2">
            {saving ? '儲存中...' : '儲存評論'}
          </button>
        </div>
      </div>
    </div>
  );
}
