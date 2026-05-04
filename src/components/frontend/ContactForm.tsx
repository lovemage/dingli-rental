'use client';

import { useState } from 'react';

type Props = {
  title?: string;
  submitText?: string;
  note?: string;
  successMessage?: string;
};

export default function ContactForm({
  title = '填寫需求表',
  submitText = '送出需求 →',
  note = '送出後我們將於 24 小時內聯繫，感謝您！',
  successMessage = '已收到您的訊息，業務專員將於當日內聯繫您。',
}: Props) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError('');

    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get('name') || ''),
      phone: String(fd.get('phone') || ''),
      email: String(fd.get('email') || ''),
      region: String(fd.get('region') || ''),
      propertyType: String(fd.get('propertyType') || ''),
      budget: String(fd.get('budget') || ''),
      message: String(fd.get('message') || ''),
    };

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || '送出失敗');
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || '送出失敗，請稍後再試或來電聯繫');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="bg-white rounded-xl border border-line p-8 sm:p-10 shadow-sm text-center">
        <div className="w-14 h-14 mx-auto rounded-full bg-brand-green-50 grid place-items-center text-brand-green-700 text-2xl font-black mb-4">
          ✓
        </div>
        <h2 className="text-xl font-black mb-2">送出成功</h2>
        <p className="text-ink-700">{successMessage}</p>
      </div>
    );
  }

  return (
    <form className="bg-white rounded-xl border border-line p-6 sm:p-8 shadow-sm" onSubmit={onSubmit}>
      <h2 className="text-xl font-black mb-5">{title}</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label-base">姓名 *</label>
          <input name="name" required maxLength={50} className="input-base" />
        </div>
        <div>
          <label className="label-base">聯絡電話 *</label>
          <input name="phone" required type="tel" maxLength={30} className="input-base" />
        </div>
        <div>
          <label className="label-base">Email</label>
          <input name="email" type="email" className="input-base" />
        </div>
        <div>
          <label className="label-base">希望地區</label>
          <select name="region" className="input-base" defaultValue="不限">
            <option>不限</option>
            <option>台北市</option>
            <option>新北市</option>
            <option>基隆市</option>
            <option>桃園市</option>
            <option>新竹市</option>
          </select>
        </div>
        <div>
          <label className="label-base">物件類型</label>
          <select name="propertyType" className="input-base" defaultValue="不限">
            <option>不限</option>
            <option>整層住家</option>
            <option>獨立套房</option>
            <option>分租套房</option>
            <option>雅房</option>
            <option>車位</option>
          </select>
        </div>
        <div>
          <label className="label-base">預算（每月）</label>
          <input name="budget" type="number" placeholder="NT$" className="input-base" />
        </div>
        <div className="sm:col-span-2">
          <label className="label-base">需求描述</label>
          <textarea name="message" rows={4} maxLength={2000} className="input-base resize-none" placeholder="請告訴我們您的居住人數、通勤地點、生活習慣等..." />
        </div>
      </div>
      {error && (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      )}
      <button type="submit" disabled={submitting} className="btn btn-primary w-full mt-6 disabled:opacity-60">
        {submitting ? '送出中...' : submitText}
      </button>
      <p className="text-xs text-ink-500 mt-3 text-center">{note}</p>
    </form>
  );
}
