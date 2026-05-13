'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  TAXONOMY_KEYS,
  TAXONOMY_LABELS,
  type TaxonomyKey,
  type Taxonomies,
} from '@/lib/taxonomies-shared';
import { TYPE_MID_LETTERS } from '@/data/taiwan-addresses';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';
type LetterMap = Record<string, string>;

export default function TaxonomyManager() {
  const [data, setData] = useState<Taxonomies | null>(null);
  const [original, setOriginal] = useState<Taxonomies | null>(null);
  // 字母對應（只給 propertyTypes 用，分支 SiteContent section='property_type_letters'）
  const [letters, setLetters] = useState<LetterMap>({});
  const [origLetters, setOrigLetters] = useState<LetterMap>({});
  const [loading, setLoading] = useState(true);
  const [activeKey, setActiveKey] = useState<TaxonomyKey>('propertyTypes');
  const [saveStates, setSaveStates] = useState<Record<TaxonomyKey, SaveState>>(
    {} as Record<TaxonomyKey, SaveState>,
  );

  useEffect(() => {
    (async () => {
      try {
        const [taxRes, lettersRes] = await Promise.all([
          fetch('/api/taxonomies', { cache: 'no-store' }),
          fetch('/api/content?section=property_type_letters', { cache: 'no-store' }),
        ]);
        const tax = (await taxRes.json()) as Taxonomies;
        setData(tax);
        setOriginal(tax);
        const lettersJson = await lettersRes.json().catch(() => null);
        const map = (lettersJson?.data?.map as LetterMap | undefined) || {};
        setLetters(map);
        setOrigLetters(map);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function effectiveLetter(typeName: string): string {
    const v = (letters[typeName] || '').toUpperCase();
    if (/^[A-Z]$/.test(v)) return v;
    return TYPE_MID_LETTERS[typeName] || 'X';
  }

  function setLetter(typeName: string, raw: string) {
    const v = raw.trim().toUpperCase().slice(0, 1);
    setLetters((m) => {
      const next = { ...m };
      if (!v) delete next[typeName];
      else next[typeName] = v;
      return next;
    });
    setSaveStates((s) => ({ ...s, propertyTypes: 'idle' }));
  }

  const lettersDirty = useMemo(() => {
    // 比較兩個 map 序列化
    return JSON.stringify(letters) !== JSON.stringify(origLetters);
  }, [letters, origLetters]);

  const dirtyKeys = useMemo(() => {
    if (!data || !original) return new Set<TaxonomyKey>();
    const dirty = new Set<TaxonomyKey>();
    for (const key of TAXONOMY_KEYS) {
      const a = data[key].join('|');
      const b = original[key].join('|');
      if (a !== b) dirty.add(key);
    }
    // 字母 mapping 變動也視為 propertyTypes tab dirty
    if (lettersDirty) dirty.add('propertyTypes');
    return dirty;
  }, [data, original, lettersDirty]);

  function update(key: TaxonomyKey, items: string[]) {
    setData((d) => (d ? { ...d, [key]: items } : d));
    setSaveStates((s) => ({ ...s, [key]: 'idle' }));
  }

  async function save(key: TaxonomyKey) {
    if (!data) return;
    setSaveStates((s) => ({ ...s, [key]: 'saving' }));
    try {
      // 主 taxonomy 區段
      const res = await fetch('/api/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: `taxonomy_${key}`,
          data: { items: data[key] },
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || '儲存失敗');
      }

      // propertyTypes tab 額外把字母 mapping 一起存
      if (key === 'propertyTypes' && lettersDirty) {
        const res2 = await fetch('/api/content', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            section: 'property_type_letters',
            data: { map: letters },
          }),
        });
        if (!res2.ok) {
          const err = await res2.json().catch(() => ({}));
          throw new Error(err?.error || '字母對應儲存失敗');
        }
        setOrigLetters({ ...letters });
      }

      setSaveStates((s) => ({ ...s, [key]: 'saved' }));
      setOriginal((orig) => (orig ? { ...orig, [key]: [...data[key]] } : orig));
      setTimeout(() => setSaveStates((s) => ({ ...s, [key]: 'idle' })), 2500);
    } catch {
      setSaveStates((s) => ({ ...s, [key]: 'error' }));
    }
  }

  if (loading || !data) return <p className="text-ink-500">載入中...</p>;

  return (
    <div className="space-y-4">
      {/* Tab 列：手機橫向捲動 */}
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="flex gap-2 px-4 sm:px-0 pb-2 min-w-max">
          {TAXONOMY_KEYS.map((key) => {
            const isActive = activeKey === key;
            const isDirty = dirtyKeys.has(key);
            return (
              <button
                key={key}
                onClick={() => setActiveKey(key)}
                className={`relative px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition border ${
                  isActive
                    ? 'bg-brand-green-700 text-white border-brand-green-700'
                    : 'bg-white text-ink-700 border-line hover:border-brand-green-500'
                }`}
              >
                {TAXONOMY_LABELS[key].title}
                {isDirty && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-brand-orange-500 rounded-full ring-2 ring-paper-2" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 編輯區 */}
      <TaxonomySection
        key={activeKey}
        title={TAXONOMY_LABELS[activeKey].title}
        hint={TAXONOMY_LABELS[activeKey].hint}
        items={data[activeKey]}
        onChange={(items) => update(activeKey, items)}
        onSave={() => save(activeKey)}
        dirty={dirtyKeys.has(activeKey)}
        state={saveStates[activeKey] || 'idle'}
      />

      {/* 字母對應（僅 propertyTypes tab） */}
      {activeKey === 'propertyTypes' && (
        <LetterMapCard
          types={data.propertyTypes}
          letters={letters}
          onChange={setLetter}
          effectiveLetter={effectiveLetter}
        />
      )}
    </div>
  );
}

function LetterMapCard({
  types,
  letters,
  onChange,
  effectiveLetter,
}: {
  types: string[];
  letters: LetterMap;
  onChange: (typeName: string, raw: string) => void;
  effectiveLetter: (typeName: string) => string;
}) {
  // 統計：有沒有兩個類型用同一字母 → 警告但不擋
  const letterCounts = new Map<string, string[]>();
  for (const t of types) {
    const l = effectiveLetter(t);
    const arr = letterCounts.get(l) || [];
    arr.push(t);
    letterCounts.set(l, arr);
  }
  const conflicts = Array.from(letterCounts.entries()).filter(([, arr]) => arr.length > 1);

  return (
    <div className="admin-card">
      <div className="mb-3 pb-3 border-b border-line">
        <h3 className="font-bold text-base">編號字母對應</h3>
        <p className="text-xs text-ink-500 mt-0.5 leading-relaxed">
          每個物件類型對應一個英文字母，作為新增物件時的編號開頭。<br />
          空白即使用系統預設（T 套房 / W 整層住家 / H 別墅 / S 店面 / O 辦公室 / X 其他）；
          系統沒對應的類型一律 X。已產生的舊編號不會回頭修改。
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {types.length === 0 && (
          <p className="text-sm text-ink-400 col-span-full">請先在上方加入物件類型</p>
        )}
        {types.map((tp) => {
          const userValue = letters[tp] || '';
          const effective = effectiveLetter(tp);
          const usingDefault = !userValue;
          return (
            <div key={tp} className="flex items-center gap-2 bg-paper-2 border border-line rounded-lg px-3 py-2">
              <span className="flex-1 text-sm font-medium truncate" title={tp}>{tp}</span>
              <input
                value={userValue}
                onChange={(e) => onChange(tp, e.target.value)}
                maxLength={1}
                placeholder={effective}
                className={`w-10 px-2 py-1 text-center font-mono font-black uppercase border rounded focus:outline-none ${usingDefault ? 'border-line text-ink-400' : 'border-brand-green-500 text-ink-900'}`}
                title={usingDefault ? `預設 ${effective}` : `自訂 ${userValue}`}
              />
            </div>
          );
        })}
      </div>

      {conflicts.length > 0 && (
        <div className="mt-3 p-3 bg-brand-orange-50 border border-brand-orange-200 rounded-lg text-xs text-brand-orange-900">
          <p className="font-bold mb-1">⚠️ 字母重複（不影響運作，但編號開頭看起來會一樣）</p>
          <ul className="list-disc list-inside space-y-0.5">
            {conflicts.map(([letter, names]) => (
              <li key={letter}>
                <span className="font-mono font-bold">{letter}</span>：{names.join('、')}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function TaxonomySection({
  title,
  hint,
  items,
  onChange,
  onSave,
  dirty,
  state,
}: {
  title: string;
  hint: string;
  items: string[];
  onChange: (items: string[]) => void;
  onSave: () => void;
  dirty: boolean;
  state: SaveState;
}) {
  const [input, setInput] = useState('');
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  function add(raw: string) {
    const t = raw.trim();
    if (!t) return;
    if (items.includes(t)) {
      setInput('');
      return;
    }
    onChange([...items, t]);
    setInput('');
  }

  function remove(i: number) {
    onChange(items.filter((_, idx) => idx !== i));
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const arr = [...items];
    [arr[i], arr[j]] = [arr[j], arr[i]];
    onChange(arr);
  }

  function startEdit(i: number) {
    setEditIdx(i);
    setEditValue(items[i]);
  }

  function commitEdit() {
    if (editIdx === null) return;
    const t = editValue.trim();
    if (!t) {
      setEditIdx(null);
      return;
    }
    if (items.includes(t) && items[editIdx] !== t) {
      setEditIdx(null);
      return;
    }
    const arr = [...items];
    arr[editIdx] = t;
    onChange(arr);
    setEditIdx(null);
  }

  return (
    <div className="admin-card">
      <div className="flex items-start justify-between gap-3 mb-3 pb-3 border-b border-line">
        <div className="min-w-0">
          <h2 className="font-bold text-lg">{title}</h2>
          <p className="text-xs text-ink-500 mt-0.5">{hint}</p>
        </div>
        <button
          onClick={onSave}
          disabled={!dirty || state === 'saving'}
          className="btn btn-primary text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {state === 'saving' ? '儲存中...' : state === 'saved' ? '已儲存 ✓' : dirty ? '儲存變更' : '已儲存'}
        </button>
      </div>

      {/* Chip list */}
      <div className="flex flex-wrap gap-2 mb-4">
        {items.length === 0 && (
          <span className="text-sm text-ink-300 px-1 py-2">尚未設定，請於下方新增</span>
        )}
        {items.map((t, i) => (
          <div
            key={`${t}-${i}`}
            className="group relative inline-flex items-center gap-1 bg-paper-2 border border-line rounded-full pl-3 pr-1 py-1 text-sm hover:border-brand-green-500 transition"
          >
            {editIdx === i ? (
              <input
                autoFocus
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitEdit();
                  if (e.key === 'Escape') setEditIdx(null);
                }}
                className="bg-transparent outline-none text-sm w-24 font-medium"
              />
            ) : (
              <button
                type="button"
                onClick={() => startEdit(i)}
                className="font-medium hover:text-brand-green-700"
                title="點擊編輯"
              >
                {t}
              </button>
            )}
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="w-6 h-6 grid place-items-center text-ink-500 hover:text-brand-green-700 disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="上移"
                title="上移"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === items.length - 1}
                className="w-6 h-6 grid place-items-center text-ink-500 hover:text-brand-green-700 disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="下移"
                title="下移"
              >
                →
              </button>
              <button
                type="button"
                onClick={() => remove(i)}
                className="w-7 h-7 grid place-items-center rounded-full text-ink-500 hover:bg-red-50 hover:text-red-600"
                aria-label={`刪除 ${t}`}
                title="刪除"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add input */}
      <div className="flex gap-2">
        <input
          type="text"
          className="input-base flex-1"
          placeholder="輸入新項目，按 Enter 加入"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add(input);
            }
          }}
        />
        <button
          type="button"
          onClick={() => add(input)}
          disabled={!input.trim()}
          className="btn btn-secondary text-sm whitespace-nowrap disabled:opacity-50"
        >
          + 加入
        </button>
      </div>

      {state === 'error' && (
        <p className="text-sm text-red-600 mt-3">儲存失敗，請稍後再試</p>
      )}
      <p className="text-xs text-ink-500 mt-3 leading-relaxed">
        💡 提示：點擊標籤文字可編輯。修改後須按右上「儲存變更」才會生效。已被既有物件使用的項目刪除後，舊資料仍保留原值，僅未來新增時無法選擇。
      </p>
    </div>
  );
}
