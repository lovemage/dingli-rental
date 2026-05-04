'use client';

import { useEffect, useState } from 'react';
import {
  AI_SETTINGS_DEFAULTS,
  DEFAULT_MODEL,
  DEFAULT_SYSTEM_PROMPT,
  DEFAULT_USER_PROMPT_TEMPLATE,
  DEFAULT_CUSTOMER_SERVICE_MODEL,
  DEFAULT_CUSTOMER_SERVICE_SYSTEM_PROMPT,
  maskModelName,
} from '@/data/ai-extract-defaults';

type ModelInfo = {
  id: string;
  name: string;
  contextLength: number;
  pricePromptPerM: number;
  priceCompletionPerM: number;
  supportsVision: boolean;
};

// 展開「AI 模型」設定區塊需輸入此密碼，避免他人不慎瀏覽或更動模型
const MODEL_UNLOCK_PASSWORD = '1234';

type TabKey = 'ocr' | 'cs';

export default function AiSettingsForm() {
  // === API Key (shared) ===
  const [apiKey, setApiKey] = useState('');
  const [apiKeyMasked, setApiKeyMasked] = useState('');
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);
  const [showKey, setShowKey] = useState(false);

  // === OCR ===
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [systemPrompt, setSystemPrompt] = useState(AI_SETTINGS_DEFAULTS.systemPrompt);
  const [userPromptTemplate, setUserPromptTemplate] = useState(AI_SETTINGS_DEFAULTS.userPromptTemplate);
  const [ocrModelOpen, setOcrModelOpen] = useState(false);
  const [ocrModelUnlocked, setOcrModelUnlocked] = useState(false);
  const [sysPromptOpen, setSysPromptOpen] = useState(false);
  const [userPromptOpen, setUserPromptOpen] = useState(false);

  // === Customer Service ===
  const [csModel, setCsModel] = useState(DEFAULT_CUSTOMER_SERVICE_MODEL);
  const [csSystemPrompt, setCsSystemPrompt] = useState(AI_SETTINGS_DEFAULTS.customerServiceSystemPrompt);
  const [csModelOpen, setCsModelOpen] = useState(false);
  const [csModelUnlocked, setCsModelUnlocked] = useState(false);
  const [csSysPromptOpen, setCsSysPromptOpen] = useState(false);

  // === Shared model picker state ===
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [modelSearch, setModelSearch] = useState('');
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState('');
  const [modelsHint, setModelsHint] = useState('');

  // === Misc ===
  const [activeTab, setActiveTab] = useState<TabKey>('ocr');
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
          if (json.customerServiceModel) setCsModel(json.customerServiceModel);
          if (json.customerServiceSystemPrompt) setCsSystemPrompt(json.customerServiceSystemPrompt);
          setApiKeyMasked(json.apiKeyMasked || '');
          setApiKeyConfigured(Boolean(json.apiKeyConfigured));
          if (json.apiKeyConfigured) {
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
        `已載入 ${json.total} 個模型（其中 ${json.visionCount} 個支援影像）${json.authenticated ? ' · 已驗證 API Key ✓' : ''}`,
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
          customerServiceModel: csModel,
          customerServiceSystemPrompt: csSystemPrompt,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || '儲存失敗');
      setApiKey('');
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

  /** 展開 AI 模型區塊：第一次需密碼，解鎖後本次 session 內可自由開合 */
  function tryToggleModelPicker(target: 'ocr' | 'cs') {
    const unlocked = target === 'ocr' ? ocrModelUnlocked : csModelUnlocked;
    const setOpen = target === 'ocr' ? setOcrModelOpen : setCsModelOpen;
    const setUnlocked = target === 'ocr' ? setOcrModelUnlocked : setCsModelUnlocked;

    if (unlocked) {
      setOpen((s) => !s);
      return;
    }
    const pwd = window.prompt('展開 AI 模型設定需要密碼：');
    if (pwd === null) return;
    if (pwd !== MODEL_UNLOCK_PASSWORD) {
      alert('密碼錯誤');
      return;
    }
    setUnlocked(true);
    setOpen(true);
  }

  function selectModel(target: 'ocr' | 'cs', newId: string) {
    if (target === 'ocr') setModel(newId);
    else setCsModel(newId);
  }

  function resetSystemPrompt() {
    if (confirm('確定要將「系統提示詞」重設為預設值？')) setSystemPrompt(DEFAULT_SYSTEM_PROMPT);
  }
  function resetUserPrompt() {
    if (confirm('確定要將「使用者提示詞」重設為預設值？')) setUserPromptTemplate(DEFAULT_USER_PROMPT_TEMPLATE);
  }
  function resetCsSystemPrompt() {
    if (confirm('確定要將「客服系統提示詞」重設為預設值？')) setCsSystemPrompt(DEFAULT_CUSTOMER_SERVICE_SYSTEM_PROMPT);
  }

  function filterModelsForPicker(requireVision: boolean): ModelInfo[] {
    let out = requireVision ? models.filter((m) => m.supportsVision) : models;
    const q = modelSearch.trim().toLowerCase();
    if (q) {
      out = out.filter((m) => m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q));
    }
    return out;
  }

  // ===== 模型卡片渲染（兩個 tab 共用） =====
  function renderModelPicker(opts: {
    title: string;
    currentModel: string;
    target: 'ocr' | 'cs';
    requireVision: boolean;
  }) {
    const { title, currentModel, target, requireVision } = opts;
    const isOpen = target === 'ocr' ? ocrModelOpen : csModelOpen;
    const unlocked = target === 'ocr' ? ocrModelUnlocked : csModelUnlocked;
    const filteredModels = filterModelsForPicker(requireVision);
    return (
      <div className="admin-card">
        <button
          type="button"
          onClick={() => tryToggleModelPicker(target)}
          className="w-full flex items-center justify-between text-left"
          aria-expanded={isOpen}
        >
          <div className="min-w-0">
            <h2 className="font-bold text-lg flex items-center gap-2">
              {title}
              {!unlocked && <span className="text-xs font-medium text-ink-500">🔒 需密碼</span>}
            </h2>
            <p className="text-xs text-ink-500 mt-0.5 truncate">
              目前選用：<code className="bg-paper-2 px-1.5 py-0.5 rounded font-mono text-xs">{maskModelName(currentModel)}</code>
            </p>
          </div>
          <span
            className={`text-ink-500 text-base flex-shrink-0 ml-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            aria-hidden
          >
            ▼
          </span>
        </button>

        {isOpen && (
          <>
            <div className="flex justify-end mt-4 pt-4 border-t border-line mb-3">
              <button type="button" onClick={() => loadModels(false)} disabled={loadingModels}
                className="btn btn-secondary text-xs whitespace-nowrap disabled:opacity-50">
                {loadingModels ? '載入中...' : '↻ 重新載入'}
              </button>
            </div>

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

            {modelsError && <p className="text-sm text-red-600 mb-2">{modelsError}</p>}
            {modelsHint && <p className="text-xs text-ink-500 mb-2">{modelsHint}</p>}

            {models.length === 0 && !loadingModels && (
              <div className="bg-paper-2 rounded-lg p-6 text-center text-sm text-ink-500">
                尚未載入模型清單。
                <button type="button" onClick={() => loadModels(false)} className="text-brand-green-700 underline">點此載入</button>
              </div>
            )}

            {models.length > 0 && (
              <div className="border border-line rounded-lg max-h-[420px] overflow-y-auto divide-y divide-line">
                {filteredModels.length === 0 ? (
                  <p className="p-4 text-sm text-ink-500 text-center">沒有符合條件的模型</p>
                ) : (
                  filteredModels.map((m) => {
                    const active = m.id === currentModel;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => selectModel(target, m.id)}
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
                            {m.contextLength > 0 && <span>· context: {(m.contextLength / 1000).toFixed(0)}K</span>}
                            {m.pricePromptPerM > 0 && <span>· in ${m.pricePromptPerM.toFixed(2)}/M</span>}
                            {m.priceCompletionPerM > 0 && <span>· out ${m.priceCompletionPerM.toFixed(2)}/M</span>}
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
              {requireVision
                ? '此區塊僅顯示支援影像輸入的模型（OCR 物件辨識需要）。'
                : '此區塊顯示所有模型（不限影像支援）。'}
              價格為每百萬 token 的美金費用，僅供參考。
            </p>
          </>
        )}
      </div>
    );
  }

  if (loading) return <p className="text-ink-500">載入中...</p>;

  return (
    <div className="space-y-5">
      {/* === API Key (shared) === */}
      <div className="admin-card">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-line">
          <div>
            <h2 className="font-bold text-lg">API Key</h2>
            <p className="text-xs text-ink-500 mt-0.5">
              「物件辨識」與「客服」共用此 Key。儲存後僅後端讀取，不會回傳到前台。
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

      {/* === Tabs === */}
      <div className="bg-white border border-line rounded-xl p-1 flex gap-1">
        <TabButton active={activeTab === 'ocr'} onClick={() => setActiveTab('ocr')}>
          AI 物件辨識
        </TabButton>
        <TabButton active={activeTab === 'cs'} onClick={() => setActiveTab('cs')}>
          AI 客服
        </TabButton>
      </div>

      {/* === Tab: OCR === */}
      {activeTab === 'ocr' && (
        <>
          {renderModelPicker({
            title: 'AI 模型（物件辨識）',
            currentModel: model,
            target: 'ocr',
            requireVision: true,
          })}

          {/* System prompt */}
          <div className="admin-card">
            <button
              type="button"
              onClick={() => setSysPromptOpen((s) => !s)}
              className="w-full flex items-center justify-between text-left"
              aria-expanded={sysPromptOpen}
            >
              <div className="min-w-0">
                <h2 className="font-bold text-lg">系統提示詞 (System Prompt)</h2>
                <p className="text-xs text-ink-500 mt-0.5">定義 AI 的角色與輸出規則。每次辨識照片時都會帶入。</p>
              </div>
              <span className={`text-ink-500 text-base flex-shrink-0 ml-3 transition-transform ${sysPromptOpen ? 'rotate-180' : ''}`} aria-hidden>▼</span>
            </button>
            {sysPromptOpen && (
              <div className="mt-4 pt-4 border-t border-line">
                <div className="flex justify-end mb-2">
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
            )}
          </div>

          {/* User prompt template */}
          <div className="admin-card">
            <button
              type="button"
              onClick={() => setUserPromptOpen((s) => !s)}
              className="w-full flex items-center justify-between text-left"
              aria-expanded={userPromptOpen}
            >
              <div className="min-w-0">
                <h2 className="font-bold text-lg">使用者提示詞範本 (User Prompt Template)</h2>
                <p className="text-xs text-ink-500 mt-0.5">定義每次辨識時送進 AI 的請求內容（含變數）。</p>
              </div>
              <span className={`text-ink-500 text-base flex-shrink-0 ml-3 transition-transform ${userPromptOpen ? 'rotate-180' : ''}`} aria-hidden>▼</span>
            </button>
            {userPromptOpen && (
              <div className="mt-4 pt-4 border-t border-line">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="text-xs text-ink-500">
                    支援變數：<code className="bg-paper-2 px-1 rounded">{'{photoCount}'}</code>、
                    <code className="bg-paper-2 px-1 rounded ml-1">{'{equipment}'}</code>、
                    <code className="bg-paper-2 px-1 rounded ml-1">{'{furniture}'}</code>、
                    <code className="bg-paper-2 px-1 rounded ml-1">{'{buildingTypes}'}</code>、
                    <code className="bg-paper-2 px-1 rounded ml-1">{'{propertyTypes}'}</code>
                  </p>
                  <button type="button" onClick={resetUserPrompt} className="text-xs text-ink-500 hover:text-brand-orange-700 whitespace-nowrap">
                    重設為預設
                  </button>
                </div>
                <textarea
                  className="input-base font-mono text-xs leading-relaxed min-h-[260px] resize-y"
                  value={userPromptTemplate}
                  onChange={(e) => setUserPromptTemplate(e.target.value)}
                />
              </div>
            )}
          </div>
        </>
      )}

      {/* === Tab: Customer Service === */}
      {activeTab === 'cs' && (
        <>
          {renderModelPicker({
            title: 'AI 模型（客服）',
            currentModel: csModel,
            target: 'cs',
            requireVision: false,
          })}

          {/* CS system prompt */}
          <div className="admin-card">
            <button
              type="button"
              onClick={() => setCsSysPromptOpen((s) => !s)}
              className="w-full flex items-center justify-between text-left"
              aria-expanded={csSysPromptOpen}
            >
              <div className="min-w-0">
                <h2 className="font-bold text-lg">客服系統提示詞 (System Prompt)</h2>
                <p className="text-xs text-ink-500 mt-0.5">定義客服 AI 的角色、語氣與服務範圍。</p>
              </div>
              <span className={`text-ink-500 text-base flex-shrink-0 ml-3 transition-transform ${csSysPromptOpen ? 'rotate-180' : ''}`} aria-hidden>▼</span>
            </button>
            {csSysPromptOpen && (
              <div className="mt-4 pt-4 border-t border-line">
                <div className="flex justify-end mb-2">
                  <button type="button" onClick={resetCsSystemPrompt} className="text-xs text-ink-500 hover:text-brand-orange-700">
                    重設為預設
                  </button>
                </div>
                <textarea
                  className="input-base font-mono text-xs leading-relaxed min-h-[260px] resize-y"
                  value={csSystemPrompt}
                  onChange={(e) => setCsSystemPrompt(e.target.value)}
                />
              </div>
            )}
          </div>
        </>
      )}

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

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-bold transition ${
        active
          ? 'bg-brand-green-700 text-white shadow-sm'
          : 'text-ink-700 hover:bg-paper-2'
      }`}
    >
      {children}
    </button>
  );
}
