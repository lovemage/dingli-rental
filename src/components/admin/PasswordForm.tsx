'use client';

import { useState } from 'react';

export default function PasswordForm() {
  const [currentPassword, setCurrent] = useState('');
  const [newPassword, setNew] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(''); setErr('');
    if (newPassword.length < 6) { setErr('新密碼至少 6 個字元'); return; }
    if (newPassword !== confirm) { setErr('兩次輸入的新密碼不一致'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data?.error || '修改失敗'); return; }
      setMsg('密碼已成功修改');
      setCurrent(''); setNew(''); setConfirm('');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="admin-card max-w-md space-y-4">
      <h2 className="font-bold text-lg pb-3 border-b border-line">修改密碼</h2>
      {err && <p className="text-sm text-red-600">{err}</p>}
      {msg && <p className="text-sm text-brand-green-700 font-bold">{msg}</p>}
      <div>
        <label className="label-base">目前密碼</label>
        <input required type="password" className="input-base" value={currentPassword} onChange={(e) => setCurrent(e.target.value)} />
      </div>
      <div>
        <label className="label-base">新密碼</label>
        <input required type="password" className="input-base" value={newPassword} onChange={(e) => setNew(e.target.value)} />
        <p className="text-xs text-ink-500 mt-1">至少 6 個字元</p>
      </div>
      <div>
        <label className="label-base">確認新密碼</label>
        <input required type="password" className="input-base" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </div>
      <button type="submit" disabled={loading} className="btn btn-primary w-full">{loading ? '處理中...' : '更新密碼'}</button>
    </form>
  );
}
