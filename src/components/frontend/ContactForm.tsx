'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('contact');
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
      if (!res.ok) throw new Error(json?.error || t('formSubmitFailed'));
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || t('formSubmitFailed'));
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
        <h2 className="text-xl font-black mb-2">{t('formSuccessTitle')}</h2>
        <p className="text-ink-700">{successMessage}</p>
      </div>
    );
  }

  return (
    <form className="bg-white rounded-xl border border-line p-6 sm:p-8 shadow-sm" onSubmit={onSubmit}>
      <h2 className="text-xl font-black mb-5">{title}</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label-base">{t('formNameLabel')}</label>
          <input name="name" required maxLength={50} className="input-base" />
        </div>
        <div>
          <label className="label-base">{t('formPhoneLabel')}</label>
          <input name="phone" required type="tel" maxLength={30} className="input-base" />
        </div>
        <div>
          <label className="label-base">{t('formEmailLabel')}</label>
          <input name="email" type="email" className="input-base" />
        </div>
        <div>
          <label className="label-base">{t('formRegionLabel')}</label>
          <select name="region" className="input-base" defaultValue="不限">
            <option value="不限">{t('formAny')}</option>
            <option value="台北市">台北市 / Taipei</option>
            <option value="新北市">新北市 / New Taipei</option>
            <option value="基隆市">基隆市 / Keelung</option>
            <option value="桃園市">桃園市 / Taoyuan</option>
            <option value="新竹市">新竹市 / Hsinchu</option>
          </select>
        </div>
        <div>
          <label className="label-base">{t('formPropertyTypeLabel')}</label>
          <select name="propertyType" className="input-base" defaultValue="不限">
            <option value="不限">{t('formAny')}</option>
            <option value="整層住家">整層住家 / Whole-Floor</option>
            <option value="獨立套房">獨立套房 / Studio</option>
            <option value="分租套房">分租套房 / Shared Suite</option>
            <option value="雅房">雅房 / Single Room</option>
            <option value="車位">車位 / Parking</option>
          </select>
        </div>
        <div>
          <label className="label-base">{t('formBudgetLabel')}</label>
          <input name="budget" type="number" placeholder="NT$" className="input-base" />
        </div>
        <div className="sm:col-span-2">
          <label className="label-base">{t('formMessageLabel')}</label>
          <textarea
            name="message"
            rows={4}
            maxLength={2000}
            className="input-base resize-none"
            placeholder={t('formMessagePlaceholder')}
          />
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="btn btn-primary w-full mt-6 disabled:opacity-60"
      >
        {submitting ? t('formSubmitting') : submitText}
      </button>
      <p className="text-xs text-ink-500 mt-3 text-center">{note}</p>
    </form>
  );
}
