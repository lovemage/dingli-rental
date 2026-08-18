'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { CITY_DISTRICTS, REGION_OPTIONS, formatRegionLabel } from '@/data/taiwan-addresses';
import LineFollowCard from '@/components/frontend/LineFollowCard';

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
  const tRegions = useTranslations('regions');
  const locale = useLocale();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('不限');
  const [selectedDistrict, setSelectedDistrict] = useState('');

  const districtOptions = CITY_DISTRICTS[selectedRegion] || [];

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError('');

    const fd = new FormData(e.currentTarget);
    const region = String(fd.get('region') || '');
    const district = String(fd.get('district') || '');
    const payload = {
      name: String(fd.get('name') || ''),
      phone: String(fd.get('phone') || ''),
      userRole: String(fd.get('userRole') || ''),
      messengerType: String(fd.get('messengerType') || ''),
      messengerHandle: String(fd.get('messengerHandle') || ''),
      region: region && district ? `${region}${district}` : region,
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
      <div className="bg-white rounded-xl border border-line p-8 sm:p-10 shadow-sm">
        <div className="text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-brand-green-50 grid place-items-center text-brand-green-700 text-2xl font-black mb-4">
            ✓
          </div>
          {/* 送出後的畫面固定中／英／日並列，外籍客戶沒切語系也能讀懂下一步 */}
          <h2 className="text-xl font-black mb-2">送出成功 / Submitted / 送信完了</h2>
          <p className="text-ink-700">{successMessage}</p>
        </div>

        {/* 送出後把詢問導進官方 LINE，由專員接手確認物件 */}
        <LineFollowCard />
      </div>
    );
  }

  return (
    <form className="bg-white rounded-xl border border-line p-6 sm:p-8 shadow-sm" onSubmit={onSubmit}>
      <h2 className="text-xl font-black mb-5">{title}</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="label-base">{t('formUserRoleLabel')}</label>
          <div className="flex gap-3 mt-1">
            <label className="flex-1 flex items-center gap-2 px-4 py-2.5 border border-line rounded-lg cursor-pointer hover:border-brand-green-500 has-[:checked]:border-brand-green-700 has-[:checked]:bg-brand-green-50 transition">
              <input type="radio" name="userRole" value="renter" required className="accent-brand-green-700" />
              <span className="font-medium">{t('formUserRoleRenter')}</span>
            </label>
            <label className="flex-1 flex items-center gap-2 px-4 py-2.5 border border-line rounded-lg cursor-pointer hover:border-brand-green-500 has-[:checked]:border-brand-green-700 has-[:checked]:bg-brand-green-50 transition">
              <input type="radio" name="userRole" value="landlord" className="accent-brand-green-700" />
              <span className="font-medium">{t('formUserRoleLandlord')}</span>
            </label>
          </div>
        </div>
        <div>
          <label className="label-base">{t('formNameLabel')}</label>
          <input name="name" required maxLength={50} className="input-base" />
        </div>
        <div>
          <label className="label-base">{t('formPhoneLabel')}</label>
          <input
            name="phone"
            required
            type="tel"
            inputMode="numeric"
            maxLength={10}
            pattern="09[0-9]{8}"
            placeholder="09xxxxxxxx"
            title="請輸入 09 開頭的 10 碼手機號碼"
            className="input-base"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label-base">{t('formMessengerLabel')}</label>
          <div className="grid grid-cols-[140px_1fr] gap-2">
            <select name="messengerType" defaultValue="line" className="input-base">
              <option value="line">{t('formMessengerLine')}</option>
              <option value="whatsapp">{t('formMessengerWhatsApp')}</option>
              <option value="wechat">{t('formMessengerWeChat')}</option>
            </select>
            <input
              name="messengerHandle"
              maxLength={80}
              className="input-base"
              placeholder={t('formMessengerHandlePlaceholder')}
            />
          </div>
        </div>
        <div>
          <label className="label-base">{t('formRegionLabel')}</label>
          <select
            name="region"
            className="input-base"
            value={selectedRegion}
            onChange={(e) => {
              setSelectedRegion(e.target.value);
              setSelectedDistrict('');
            }}
          >
            <option value="不限">{t('formAny')}</option>
            {REGION_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {formatRegionLabel(tRegions(r.labelKey), r.en, locale)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label-base">{t('formDistrictLabel')}</label>
          <select
            name="district"
            className="input-base"
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            disabled={!districtOptions.length}
          >
            <option value="">{t('formAny')}</option>
            {districtOptions.map((district) => (
              <option key={district} value={district}>{district}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label-base">{t('formPropertyTypeLabel')}</label>
          <select name="propertyType" className="input-base" defaultValue="不限">
            <option value="不限">{t('formAny')}</option>
            <option value="套房">套房 / Studio</option>
            <option value="整層住家">整層住家 / Whole-Floor</option>
            <option value="別墅">別墅 / Villa</option>
            <option value="店面">店面 / Shop</option>
            <option value="辦公室">辦公室 / Office</option>
            <option value="其他">其他 / Other</option>
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
