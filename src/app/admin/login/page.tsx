'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get('next') || '/admin';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data?.error || '登入失敗');
      } else {
        router.push(next);
        router.refresh();
      }
    } catch {
      setErr('連線失敗');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen grid place-items-center bg-paper-2 p-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-white rounded-xl shadow-md border border-line p-7">
        <div className="text-center mb-6">
          <Image src="/LOGO_0.png" alt="鼎立租售管理" width={220} height={44} priority className="h-12 w-auto mx-auto mb-3" style={{ width: 'auto' }} />
          <p className="text-sm text-ink-500">後台管理系統</p>
        </div>

        <label className="label-base">帳號</label>
        <input
          required
          autoFocus
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="input-base mb-4"
        />

        <label className="label-base">密碼</label>
        <input
          required
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-base mb-2"
        />

        {err && <p className="text-sm text-red-600 mt-2">{err}</p>}

        <button type="submit" disabled={loading} className="btn btn-primary w-full mt-5">
          {loading ? '登入中...' : '登入'}
        </button>

        <p className="mt-4 text-xs text-ink-500 text-center">
          首次登入帳密：<code className="bg-paper-2 px-1.5 py-0.5 rounded">admin / dingli123</code>
        </p>
      </form>
    </main>
  );
}
