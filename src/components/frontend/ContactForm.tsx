'use client';

import { useState } from 'react';

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <form className="bg-white rounded-xl border border-line p-6 sm:p-8 shadow-sm" onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}>
      <h2 className="text-xl font-black mb-5">填寫需求表</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label-base">姓名 *</label>
          <input required className="input-base" />
        </div>
        <div>
          <label className="label-base">聯絡電話 *</label>
          <input required type="tel" className="input-base" />
        </div>
        <div>
          <label className="label-base">Email</label>
          <input type="email" className="input-base" />
        </div>
        <div>
          <label className="label-base">希望地區</label>
          <select className="input-base">
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
          <select className="input-base">
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
          <input type="number" placeholder="NT$" className="input-base" />
        </div>
        <div className="sm:col-span-2">
          <label className="label-base">需求描述</label>
          <textarea rows={4} className="input-base resize-none" placeholder="請告訴我們您的居住人數、通勤地點、生活習慣等..." />
        </div>
      </div>
      <button type="submit" className="btn btn-primary w-full mt-6">送出需求 →</button>
      <p className="text-xs text-ink-500 mt-3 text-center">送出後我們將於 24 小時內聯繫，感謝您！</p>
      {submitted && <p className="mt-3 text-center text-brand-green-700 font-bold">已收到您的訊息，業務專員將於當日內聯繫您。</p>}
    </form>
  );
}
