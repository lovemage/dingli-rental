'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AI_SETTINGS_DEFAULTS,
  DEFAULT_MODEL,
  DEFAULT_SYSTEM_PROMPT,
  DEFAULT_USER_PROMPT_TEMPLATE,
} from '@/data/ai-extract-defaults';

type ModelInfo = {
  id: string;
  name: string;
  contextLength: number;
  pricePromptPerM: number;
  priceCompletionPerM: number;
  supportsVision: boolean;
};

export default function AiSettingsForm() {
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [systemPrompt, setSystemPrompt] = useState(AI_SETTINGS_DEFAULTS.systemPrompt);
  const [userPromptTemplate, setUserPromptTemplate] = useState(AI_SETTINGS_DEFAULTS.userPromptTemplate);
  const [apiKey, setApiKey] = useState('');
  const [apiKeyMasked, setApiKeyMasked] = useState('');
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const [models, setModels] = useState<ModelInfo[]>([]);
  const [modelSearch, setModelSearch] = useState('');
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState('');
  const [modelsHint, setModelsHint] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  // 初次載入：拿設定 + 若已有 key 自動拉模型
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/ai-settings', { cache: 'no-store' });
        const json = await res.json();
        if (res.ok) {
          if (json.model) setModel(json.model);
          if (json.systemPrompt) setSystemPrompt(json.systemPrompt);
          if (json.userPromptTemplate) setUserPromptTemplate(json.userPromptTemplate);
          setApiKeyMasked(json.apiKeyMasked || '');
          setApiKeyConfigured(Boolean(json.apiKeyConfigured));
          if (json.apiKeyConfigured) {
            // 已有 key → 自動載入模型清單
            void loadModels();
          }
        }
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadModels(useTypedKey: boolean = false) {
    setLoadingModels(true); setModelsError(''); setModelsHint('');
    try {
      const res = await fetch('/api/admin/ai-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: useTypedKey ? apiKey : '' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || '載入模型失敗');
      setModels(json.models || []);
      setModelsHint(
        `已載入 ${json.visionCount} 個支援影像的模型${json.authenticated ? '（已驗證 API Key ✓）' : ''}`,
      );
    } catch (e: any) {
      setModelsError(e?.message || '載入模型失敗');
    } finally {
      setLoadingModels(false);
    }
  }

  async function save() {
    setSaving(true); setMsg('');
    try {
      const res = await fetch('/api/admin/ai-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          openrouterApiKey: apiKey, // 空字串 = 保留原 key
          model,
          systemPrompt,
          userPromptTemplate,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || '儲存失敗');
      setApiKey(''); // 清空輸入避免後續誤覆蓋
      setApiKeyMasked(json.apiKeyMasked || '');
      setApiKeyConfigured(Boolean(json.apiKeyConfigured));
      setMsg('已儲存 ✓');
      setTimeout(() => setMsg(''), 4000);
    } catch (e: any) {
      setMsg(e?.message || '儲存失敗');
    } finally {
      setSaving(false);
    }
  }

  function resetSystemPrompt() {
    if (confirm('確定要將「系統提示詞」重設為預設值？')) setSystemPrompt(DEFAULT_SYSTEM_PROMPT);
  }
  function resetUserPrompt() {
    if (confirm('確定要將「使用者提示詞」重設為預設值？')) setUserPromptTemplate(DEFAULT_USER_PROMPT_TEMPLATE);
  }

  const filteredModels = useMemo(() => {
    if (!modelSearch.trim()) return models;
    const q = modelSearch.trim().toLowerCase();
    return models.filter(
      (m) => m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q),
    );
  }, [models, modelSearch]);

  if (loading) return <p className="text-ink-500">載入中...</p>;

  return (
    <div className="space-y-5">
      {/* === API Key === */}
      <div className="admin-card">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-line">
          <div>
            <h2 className="font-bold text-lg">API Key</h2>
            <p className="text-xs text-ink-500 mt-0.5">
              AI 拍照辨識使用的 API Key。儲存後僅後端讀取，不會回傳到前台。
            </p>
          </div>
          <span className={`text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap ${apiKeyConfigured ? 'bg-brand-green-50 text-brand-green-700' : 'bg-red-50 text-red-700'}`}>
            {apiKeyConfigured ? `✓ 已設定 (${apiKeyMasked})` : '✗ 尚未設定'}
          </span>
        </div>

        <div className="flex gap-2">
          <input
            type={showKey ? 'text' : 'password'}
            className="input-base font-mono text-sm flex-1"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            onBlur={() => { if (apiKey.trim()) void loadModels(true); }}
            placeholder={apiKeyConfigured ? '留空 = 保留原 key；輸入新 key 才會覆蓋' : '請貼上 API Key'}
            autoComplete="new-password"
          />
          <button type="button" onClick={() => setShowKey((s) => !s)}
            className="btn btn-secondary text-xs whitespace-nowrap">
            {showKey ? '隱藏' : '顯示'}
          </button>
        </div>
        <p className="text-xs text-ink-500 mt-2">
          輸入 Key 後游標離開即會自動載入可用模型清單。
        </p>
      </div>

      {/* === Model picker === */}
      <div className="admin-card">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-line">
          <div>
            <h2 className="font-bold text-lg">AI 模型</h2>
            <p className="text-xs text-ink-500 mt-0.5">
              目前選用：<code className="bg-paper-2 px-1.5 py-0.5 rounded font-mono text-xs">{model}</code>
            </p>
          </div>
          <button type="button" onClick={() => loadModels(false)} disabled={loadingModels}
            className="btn btn-secondary text-xs whitespace-nowrap disabled:opacity-50">
            {loadingModels ? '載入中...' : '↻ 重新載入'}
          </button>
        </div>

        {/* 搜尋 */}
        <div className="relative mb-3">
          <input
            type="text"
            className="input-base pl-9"
            value={modelSearch}
            onChange={(e) => setModelSearch(e.target.value)}
            placeholder="搜尋模型（例：claude / gemini / gpt / vision）"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300 text-base pointer-events-none">🔍</span>
          {modelSearch && (
            <button type="button" onClick={() => setModelSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-ink-500 hover:text-ink-900 px-2 py-1">✕</button>
          )}
        </div>

        {modelsError && (
          <p className="text-sm text-red-600 mb-2">{modelsError}</p>
        )}
        {modelsHint && (
          <p className="text-xs text-ink-500 mb-2">{modelsHint}</p>
        )}

        {models.length === 0 && !loadingModels && (
          <div className="bg-paper-2 rounded-lg p-6 text-center text-sm text-ink-500">
            尚未載入模型清單。<button type="button" onClick={() => loadModels(false)} className="text-brand-green-700 underline">點此載入</button>
          </div>
        )}

        {models.length > 0 && (
          <div className="border border-line rounded-lg max-h-[420px] overflow-y-auto divide-y divide-line">
            {filteredModels.length === 0 ? (
              <p className="p-4 text-sm text-ink-500 text-center">沒有符合條件的模型</p>
            ) : (
              filteredModels.map((m) => {
                const active = m.id === model;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setModel(m.id)}
                    className={`w-full text-left px-4 py-3 transition flex items-center justify-between gap-3 ${active ? 'bg-brand-green-50' : 'hover:bg-paper-2'}`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-mono text-sm ${active ? 'text-brand-green-900 font-bold' : 'text-ink-900'}`}>
                          {m.id}
                        </span>
                        {active && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-green-700 text-white">
                            目前選用
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-ink-500 mt-0.5">
                        <span>{m.name}</span>
                        {m.contextLength > 0 && (
                          <span>· context: {(m.contextLength / 1000).toFixed(0)}K</span>
                        )}
                        {m.pricePromptPerM > 0 && (
                          <span>· in ${m.pricePromptPerM.toFixed(2)}/M</span>
                        )}
                        {m.priceCompletionPerM > 0 && (
                          <span>· out ${m.priceCompletionPerM.toFixed(2)}/M</span>
                        )}
                      </div>
                    </div>
                    {active && <span className="text-brand-green-700 font-bold">✓</span>}
                  </button>
                );
              })
            )}
          </div>
        )}

        <p className="text-xs text-ink-500 mt-2">
          僅列出支援影像輸入的模型。價格為每百萬 token 的美金費用，僅供參考。
        </p>
      </div>

      {/* === System prompt === */}
      <div className="admin-card">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-line">
          <div>
            <h2 className="font-bold text-lg">系統提示詞 (System Prompt)</h2>
            <p className="text-xs text-ink-500 mt-0.5">
              定義 AI 的角色與輸出規則。每次辨識照片時都會帶入。
            </p>
          </div>
          <button type="button" onClick={resetSystemPrompt} className="text-xs text-ink-500 hover:text-brand-orange-700">
            重設為預設
          </button>
        </div>
        <textarea
          className="input-base font-mono text-xs leading-relaxed min-h-[260px] resize-y"
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
        />
      </div>

      {/* === User prompt === */}
      <div className="admin-card">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-line">
          <div>
            <h2 className="font-bold text-lg">使用者提示詞範本 (User Prompt Template)</h2>
            <p className="text-xs text-ink-500 mt-0.5">
              支援變數：<code className="bg-paper-2 px-1 rounded">{'{photoCount}'}</code>、
              <code className="bg-paper-2 px-1 rounded ml-1">{'{equipment}'}</code>、
              <code className="bg-paper-2 px-1 rounded ml-1">{'{furniture}'}</code>、
              <code className="bg-paper-2 px-1 rounded ml-1">{'{buildingTypes}'}</code>、
              <code className="bg-paper-2 px-1 rounded ml-1">{'{propertyTypes}'}</code>
            </p>
          </div>
          <button type="button" onClick={resetUserPrompt} className="text-xs text-ink-500 hover:text-brand-orange-700">
            重設為預設
          </button>
        </div>
        <textarea
          className="input-base font-mono text-xs leading-relaxed min-h-[260px] resize-y"
          value={userPromptTemplate}
          onChange={(e) => setUserPromptTemplate(e.target.value)}
        />
      </div>

      {/* === 底部固定送出列 === */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white border-t border-line px-4 py-3 z-20">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-3">
          {msg ? <p className="text-sm text-brand-green-700">{msg}</p> : <span />}
          <button type="button" onClick={save} disabled={saving} className="btn btn-primary">
            {saving ? '儲存中...' : '儲存全部設定'}
          </button>
        </div>
      </div>
      <div className="h-16" />
    </div>
  );
}
