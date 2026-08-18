'use client';

import { useState } from 'react';
import { CITY_DISTRICTS, REGION_OPTIONS } from '@/data/taiwan-addresses';
import LineFollowCard from '@/components/frontend/LineFollowCard';

export default function RepairContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('台北市');
  const [selectedDistrict, setSelectedDistrict] = useState('');

  const districtOptions = CITY_DISTRICTS[selectedRegion] || [];

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError('');

    const fd = new FormData(e.currentTarget);
    const region = String(fd.get('region') || '').trim();
    const district = String(fd.get('district') || '').trim();
    const lineId = String(fd.get('lineId') || '').trim();
    const payload = {
      name: String(fd.get('name') || '').trim(),
      phone: String(fd.get('phone') || '').trim(),
      userRole: 'landlord',
      messengerType: 'line',
      messengerHandle: lineId,
      region: region && district ? `${region}${district}` : region,
      propertyType: '房屋修繕',
      budget: '',
      message: `房屋修繕裝潢需求${lineId ? `\nLINE ID：${lineId}` : ''}`,
    };

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || '送出失敗，請稍後再試');
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || '送出失敗，請稍後再試');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-line bg-white p-8 shadow-sm">
        <div className="text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-brand-green-50 text-2xl font-black text-brand-green-700">
            ✓
          </div>
          {/* 送出後的畫面固定中／英／日並列，外籍屋主沒切語系也能讀懂下一步 */}
          <h3 className="text-xl font-black text-ink-900">已收到修繕需求 / Received / 受け付けました</h3>
          <p className="mt-2 text-sm leading-7 text-ink-600">
            鼎立業務會先確認房屋狀況與地區，再協助安排後續溝通。
          </p>
        </div>

        {/* 送出後把需求導進官方 LINE，由專員接手確認 */}
        <LineFollowCard />
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-line bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-2xl font-black text-brand-green-900">建立修繕聯絡表單</h2>
      <p className="mt-2 text-sm leading-7 text-ink-500">
        留下基本資料後，我們會由專人聯繫，協助判斷修繕項目與後續安排。
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label-base">姓名</label>
          <input name="name" required maxLength={50} className="input-base" />
        </div>
        <div>
          <label className="label-base">電話</label>
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
        <div>
          <label className="label-base">LINE ID</label>
          <input name="lineId" required maxLength={80} className="input-base" placeholder="請填寫方便聯繫的 LINE ID" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label-base">縣市</label>
            <select
              name="region"
              required
              className="input-base"
              value={selectedRegion}
              onChange={(e) => {
                setSelectedRegion(e.target.value);
                setSelectedDistrict('');
              }}
            >
              {REGION_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.value}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-base">地區</label>
            <select
              name="district"
              required
              className="input-base"
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
            >
              <option value="">請選擇</option>
              {districtOptions.map((district) => (
                <option key={district} value={district}>{district}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={submitting} className="btn btn-primary mt-6 w-full disabled:opacity-60">
        {submitting ? '送出中...' : '送出修繕需求'}
      </button>
    </form>
  );
}
