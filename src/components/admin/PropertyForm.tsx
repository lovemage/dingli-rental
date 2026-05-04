'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MaterialIcon from '@/components/admin/MaterialIcon';
import {
  CITY_DISTRICTS,
  REGIONS,
  PROPERTY_TYPES,
  BUILDING_TYPES,
  EQUIPMENT_OPTIONS,
  FURNITURE_OPTIONS,
  TENANT_TYPES,
  DEPOSIT_OPTIONS,
  RENT_INCLUDES_OPTIONS,
  MIN_LEASE_OPTIONS,
  DIRECTION_OPTIONS,
  FLOOR_TYPE_OPTIONS,
  FEATURE_TAGS,
  CUSTOM_TAG_SUGGESTIONS,
} from '@/data/taiwan-addresses';
import type { Taxonomies } from '@/lib/taxonomies-shared';
import { LISTING_STATUS_OPTIONS } from '@/components/frontend/PropertyCard';

export type PropertyFormValue = {
  region: string;
  typeMid: string;
  buildingType: string;
  adType?: string;
  city: string;
  district: string;
  street?: string;
  lane?: string;
  alley?: string;
  number: string;
  numberSub?: string;
  hideAddress: boolean;
  floorType: string;
  floor?: string;
  floorSub?: string;
  totalFloor?: string;
  community?: string;
  rooms: number;
  livingRooms: number;
  bathrooms: number;
  balconies: number;
  openLayout: boolean;
  buildingAge?: number | '';
  ageUnknown: boolean;
  direction?: string;
  usableArea: number | '';
  registeredArea?: number | '';
  equipment: string[];
  furniture: string[];
  hasElevator: boolean;
  tenantTypes: string[];
  cookingAllowed: boolean;
  petsAllowed: boolean;
  rent: number | '';
  deposit: string;
  rentIncludes: string[];
  managementFee?: number | '';
  noManagementFee: boolean;
  minLease: string;
  moveInDate?: string;
  anytimeMoveIn: boolean;
  title: string;
  featureTags: string[];
  description: string;
  status: string;
  listingStatus: string;
  featured: boolean;
  images: string[];
};

const DEFAULTS: PropertyFormValue = {
  region: '台北市', typeMid: '整層住家', buildingType: '電梯大樓',
  adType: '', city: '台北市', district: '', street: '', lane: '', alley: '', number: '', numberSub: '',
  hideAddress: false,
  floorType: '出租單層', floor: '', floorSub: '', totalFloor: '',
  community: '',
  rooms: 1, livingRooms: 1, bathrooms: 1, balconies: 1, openLayout: false,
  buildingAge: '', ageUnknown: false, direction: '',
  usableArea: '', registeredArea: '',
  equipment: [], furniture: [], hasElevator: false,
  tenantTypes: [], cookingAllowed: true, petsAllowed: false,
  rent: '', deposit: '面議', rentIncludes: [], managementFee: '', noManagementFee: false,
  minLease: '一年', moveInDate: '', anytimeMoveIn: false,
  title: '', featureTags: [], description: '',
  status: 'active', listingStatus: 'active', featured: false,
  images: [],
};

type Props = {
  initial?: Partial<PropertyFormValue>;
  propertyId?: number;
  taxonomies?: Taxonomies;
};

export default function PropertyForm({ initial, propertyId, taxonomies }: Props) {
  const router = useRouter();
  const [v, setV] = useState<PropertyFormValue>({ ...DEFAULTS, ...(initial as any) });

  // 動態分類選項（後台「標籤與分類」可編輯，未登入或讀取失敗時 fallback 至 data 預設值）
  const PROP_TYPES   = taxonomies?.propertyTypes        || (PROPERTY_TYPES as readonly string[]);
  const BLD_TYPES    = taxonomies?.buildingTypes        || (BUILDING_TYPES as readonly string[]);
  const EQUIP_OPTS   = taxonomies?.equipment            || (EQUIPMENT_OPTIONS as readonly string[]);
  const FURN_OPTS    = taxonomies?.furniture            || (FURNITURE_OPTIONS as readonly string[]);
  const TENANT_OPTS  = taxonomies?.tenantTypes          || (TENANT_TYPES as readonly string[]);
  const RENT_INC     = taxonomies?.rentIncludes         || (RENT_INCLUDES_OPTIONS as readonly string[]);
  const POLICY_TAGS  = taxonomies?.policyTags           || (FEATURE_TAGS as readonly string[]);
  const CUSTOM_SUGS  = taxonomies?.customTagSuggestions || (CUSTOM_TAG_SUGGESTIONS as readonly string[]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const districts = CITY_DISTRICTS[v.city] || [];

  function update<K extends keyof PropertyFormValue>(k: K, val: PropertyFormValue[K]) {
    setV((s) => ({ ...s, [k]: val }));
  }

  function toggleArray<K extends keyof PropertyFormValue>(k: K, item: string) {
    setV((s) => {
      const arr = (s[k] as unknown as string[]) || [];
      const next = arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
      return { ...s, [k]: next as any };
    });
  }

  async function uploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setErr('');
    try {
      const fd = new FormData();
      for (const f of Array.from(files)) fd.append('files', f);
      const res = await fetch('/api/upload?subdir=properties', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || '上傳失敗');
      const newUrls = (data.files as any[]).map((f) => f.url);
      update('images', [...v.images, ...newUrls].slice(0, 20));
    } catch (e: any) {
      setErr(e?.message || '上傳失敗');
    } finally {
      setUploading(false);
    }
  }

  function removeImage(url: string) {
    update('images', v.images.filter((u) => u !== url));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setSaving(true);

    // 必填基本檢查
    if (!v.title || v.title.length < 6 || v.title.length > 30) {
      setErr('廣告標題請填寫 6 ~ 30 個字'); setSaving(false); return;
    }
    if (!v.city || !v.district || !v.number) {
      setErr('請完整填寫地址（縣市/鄉鎮/號）'); setSaving(false); return;
    }
    if (!v.usableArea || Number(v.usableArea) <= 0) {
      setErr('請填寫可使用坪數'); setSaving(false); return;
    }
    if (!v.rent || Number(v.rent) <= 0) {
      setErr('請填寫租金'); setSaving(false); return;
    }

    try {
      const payload = {
        ...v,
        region: v.city, // 大分類 = 縣市
        rent: Number(v.rent),
        rooms: Number(v.rooms),
        livingRooms: Number(v.livingRooms),
        bathrooms: Number(v.bathrooms),
        balconies: Number(v.balconies),
        usableArea: Number(v.usableArea),
        registeredArea: v.registeredArea === '' ? null : Number(v.registeredArea),
        managementFee: v.managementFee === '' ? null : Number(v.managementFee),
        buildingAge: v.buildingAge === '' ? null : Number(v.buildingAge),
        moveInDate: v.moveInDate || null,
      };

      const url = propertyId ? `/api/properties/${propertyId}` : '/api/properties';
      const res = await fetch(url, {
        method: propertyId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || '儲存失敗');

      router.push('/admin/properties');
      router.refresh();
    } catch (e: any) {
      setErr(e?.message || '儲存失敗');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5 pb-24">
      {err && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{err}</div>}

      {/* === 物件分類（大/中/小） === */}
      <Card title="物件分類">
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="大分類（縣市）">
            <select className="input-base" value={v.city} onChange={(e) => { update('city', e.target.value); update('district', ''); }}>
              {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>
          <Field label="中分類（類型）">
            <select className="input-base" value={v.typeMid} onChange={(e) => update('typeMid', e.target.value)}>
              {PROP_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="小分類（建物）">
            <select className="input-base" value={v.buildingType} onChange={(e) => update('buildingType', e.target.value)}>
              {BLD_TYPES.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </Field>
        </div>
      </Card>

      {/* === 基礎資料 === */}
      <Card title="基礎資料">
        {/* 出租地址 */}
        <Field label="出租地址 *" required>
          <div className="grid grid-cols-2 sm:grid-cols-[1fr_1fr_1fr_auto_auto_auto_auto] gap-2">
            <select className="input-base" value={v.city} onChange={(e) => { update('city', e.target.value); update('district', ''); }}>
              <option value="">請選擇縣市</option>
              {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <select className="input-base" value={v.district} onChange={(e) => update('district', e.target.value)}>
              <option value="">請選擇鄉鎮</option>
              {districts.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <input className="input-base" placeholder="請選擇街道" value={v.street || ''} onChange={(e) => update('street', e.target.value)} />
            <div className="flex items-center gap-1">
              <input className="input-base !w-20" placeholder="選填" value={v.lane || ''} onChange={(e) => update('lane', e.target.value)} />
              <span className="text-sm font-bold whitespace-nowrap">巷</span>
            </div>
            <div className="flex items-center gap-1">
              <input className="input-base !w-20" placeholder="選填" value={v.alley || ''} onChange={(e) => update('alley', e.target.value)} />
              <span className="text-sm font-bold whitespace-nowrap">弄</span>
            </div>
            <div className="flex items-center gap-1">
              <input className="input-base !w-20" placeholder="必填" value={v.number} onChange={(e) => update('number', e.target.value)} />
              <span className="text-sm font-bold whitespace-nowrap">號</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold">之</span>
              <input className="input-base !w-20" placeholder="選填" value={v.numberSub || ''} onChange={(e) => update('numberSub', e.target.value)} />
            </div>
          </div>
          <label className="inline-flex items-center gap-2 mt-2 text-sm">
            <input type="checkbox" checked={v.hideAddress} onChange={(e) => update('hideAddress', e.target.checked)} />
            隱藏門號（前台僅顯示至街道）
          </label>
        </Field>

        {/* 樓層 */}
        <Field label="樓層">
          <div className="grid grid-cols-2 sm:grid-cols-[1fr_auto_auto_auto_1fr] gap-2 items-center">
            <select className="input-base" value={v.floorType} onChange={(e) => update('floorType', e.target.value)}>
              {FLOOR_TYPE_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
            <div className="flex items-center gap-1">
              <input className="input-base !w-20" placeholder="必填" value={v.floor || ''} onChange={(e) => update('floor', e.target.value)} />
              <span className="text-sm font-bold whitespace-nowrap">樓</span>
            </div>
            <span className="text-sm font-bold">之</span>
            <input className="input-base !w-20" placeholder="選填" value={v.floorSub || ''} onChange={(e) => update('floorSub', e.target.value)} />
            <span className="text-xs text-ink-500">（出租樓層 0 為整棟，-1 為地下樓，+1 為頂樓加蓋）</span>
          </div>
        </Field>

        <Field label="出租總樓層 *" required>
          <div className="flex items-center gap-2">
            <span className="text-sm">共</span>
            <input className="input-base !w-32" placeholder="必填" value={v.totalFloor || ''} onChange={(e) => update('totalFloor', e.target.value)} />
            <span className="text-sm font-bold">層</span>
          </div>
        </Field>

        <Field label="社區名稱">
          <input className="input-base" placeholder="填寫正確社區名，廣告即可在社區找房頁面進行曝光" value={v.community || ''} onChange={(e) => update('community', e.target.value)} />
        </Field>

        {/* 格局 */}
        <Field label="格局（現況） *" required>
          <div className="grid grid-cols-4 gap-2">
            {[
              ['rooms', '房', true],
              ['livingRooms', '廳'],
              ['bathrooms', '衛'],
              ['balconies', '陽台'],
            ].map(([k, suffix, req]) => (
              <div key={k as string} className="flex items-center gap-1">
                <input
                  type="number" min={0}
                  className="input-base !w-full"
                  placeholder={req ? '必填' : '選填'}
                  value={(v as any)[k as string] ?? ''}
                  onChange={(e) => update(k as any, e.target.value === '' ? 0 : Number(e.target.value))}
                />
                <span className="text-sm font-bold">{suffix as string}</span>
              </div>
            ))}
          </div>
          <label className="inline-flex items-center gap-2 mt-2 text-sm">
            <input type="checkbox" checked={v.openLayout} onChange={(e) => update('openLayout', e.target.checked)} />
            開放式格局
          </label>
        </Field>

        {/* 屋齡 */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="屋齡">
            <div className="flex items-center gap-2">
              <input type="number" min={0} className="input-base !w-32" value={v.buildingAge ?? ''} onChange={(e) => update('buildingAge', e.target.value === '' ? '' : Number(e.target.value))} />
              <span className="text-sm">年</span>
              <label className="inline-flex items-center gap-2 text-sm ml-2">
                <input type="checkbox" checked={v.ageUnknown} onChange={(e) => update('ageUnknown', e.target.checked)} />
                屋齡不詳
              </label>
            </div>
            <p className="text-xs text-ink-500 mt-1">屋齡一年內請先填入 0</p>
          </Field>

          <Field label="朝向">
            <select className="input-base" value={v.direction || ''} onChange={(e) => update('direction', e.target.value)}>
              <option value="">請選擇</option>
              {DIRECTION_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
        </div>

        {/* 坪數 */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="可使用坪數 *" required>
            <div className="flex items-center gap-2">
              <input type="number" step="0.01" min={0} className="input-base" placeholder="請填寫室內實際使用坪數" value={v.usableArea} onChange={(e) => update('usableArea', e.target.value === '' ? '' : Number(e.target.value))} />
              <span className="text-sm font-bold">坪</span>
            </div>
          </Field>

          <Field label="權狀坪數">
            <div className="flex items-center gap-2">
              <input type="number" step="0.01" min={0} className="input-base" placeholder="請填寫權狀登載之內容" value={v.registeredArea ?? ''} onChange={(e) => update('registeredArea', e.target.value === '' ? '' : Number(e.target.value))} />
              <span className="text-sm font-bold">坪</span>
            </div>
          </Field>
        </div>

        {/* 設備家具 */}
        <Field label="提供設備">
          <div className="flex flex-wrap gap-3">
            {EQUIP_OPTS.map((e) => (
              <label key={e} className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={v.equipment.includes(e)} onChange={() => toggleArray('equipment', e)} />
                {e}
              </label>
            ))}
          </div>
        </Field>

        <Field label="提供家具">
          <div className="flex flex-wrap gap-3">
            {FURN_OPTS.map((f) => (
              <label key={f} className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={v.furniture.includes(f)} onChange={() => toggleArray('furniture', f)} />
                {f}
              </label>
            ))}
          </div>
        </Field>

        <Field label="電梯">
          <select className="input-base !w-32" value={v.hasElevator ? '有' : '無'} onChange={(e) => update('hasElevator', e.target.value === '有')}>
            <option value="無">無</option>
            <option value="有">有</option>
          </select>
        </Field>

        {/* 身份 / 規範 */}
        <Field label="身份要求">
          <div className="flex flex-wrap gap-3">
            {TENANT_OPTS.map((t) => (
              <label key={t} className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={v.tenantTypes.includes(t)} onChange={() => toggleArray('tenantTypes', t)} />
                {t}
              </label>
            ))}
          </div>
        </Field>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="開伙">
            <div className="flex gap-4 text-sm">
              <label className="inline-flex items-center gap-2"><input type="radio" name="cooking" checked={v.cookingAllowed} onChange={() => update('cookingAllowed', true)} />可</label>
              <label className="inline-flex items-center gap-2"><input type="radio" name="cooking" checked={!v.cookingAllowed} onChange={() => update('cookingAllowed', false)} />不可</label>
            </div>
          </Field>
          <Field label="養寵物">
            <div className="flex gap-4 text-sm">
              <label className="inline-flex items-center gap-2"><input type="radio" name="pets" checked={v.petsAllowed} onChange={() => update('petsAllowed', true)} />可</label>
              <label className="inline-flex items-center gap-2"><input type="radio" name="pets" checked={!v.petsAllowed} onChange={() => update('petsAllowed', false)} />不可</label>
            </div>
          </Field>
        </div>
      </Card>

      {/* === 房屋價格 === */}
      <Card title="房屋價格">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="租金 *" required>
            <div className="flex items-center gap-2">
              <input type="number" min={0} className="input-base" placeholder="限填入數字" value={v.rent} onChange={(e) => update('rent', e.target.value === '' ? '' : Number(e.target.value))} />
              <span className="text-sm whitespace-nowrap">元/月</span>
            </div>
          </Field>

          <Field label="押金 *" required>
            <select className="input-base" value={v.deposit} onChange={(e) => update('deposit', e.target.value)}>
              {DEPOSIT_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
        </div>

        <Field label="租金包含">
          <div className="flex flex-wrap gap-3">
            {RENT_INC.map((r) => (
              <label key={r} className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={v.rentIncludes.includes(r)} onChange={() => toggleArray('rentIncludes', r)} />
                {r}
              </label>
            ))}
          </div>
        </Field>

        <Field label="管理費">
          <div className="flex items-center gap-2">
            <input type="number" min={0} className="input-base !w-36" placeholder="元/月" value={v.managementFee ?? ''} disabled={v.noManagementFee} onChange={(e) => update('managementFee', e.target.value === '' ? '' : Number(e.target.value))} />
            <span className="text-sm">元/月</span>
            <label className="inline-flex items-center gap-2 text-sm ml-2">
              <input type="checkbox" checked={v.noManagementFee} onChange={(e) => update('noManagementFee', e.target.checked)} />
              無
            </label>
          </div>
        </Field>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="最短租期 *" required>
            <select className="input-base" value={v.minLease} onChange={(e) => update('minLease', e.target.value)}>
              {MIN_LEASE_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </Field>

          <Field label="可遷入日">
            <div className="flex items-center gap-2">
              <input type="date" className="input-base" value={v.moveInDate || ''} disabled={v.anytimeMoveIn} onChange={(e) => update('moveInDate', e.target.value)} />
              <label className="inline-flex items-center gap-2 text-sm ml-2">
                <input type="checkbox" checked={v.anytimeMoveIn} onChange={(e) => update('anytimeMoveIn', e.target.checked)} />
                隨時可遷入
              </label>
            </div>
          </Field>
        </div>
      </Card>

      {/* === 特色描述 === */}
      <Card title="特色描述">
        <Field label="廣告標題 *" required>
          <input className="input-base" placeholder="請用簡單文字描述物件特色，限 6 ~ 30 個字" value={v.title} maxLength={30} onChange={(e) => update('title', e.target.value)} />
          <p className="text-xs text-ink-500 mt-1">已輸入 {v.title.length} 字，限 6 ~ 30 字</p>
        </Field>

        <Field label="制度型標籤">
          <div className="flex flex-wrap gap-3">
            {POLICY_TAGS.map((t) => (
              <label
                key={t}
                className={`inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-full border cursor-pointer transition ${v.featureTags.includes(t) ? 'bg-brand-green-50 border-brand-green-500 text-brand-green-900' : 'bg-white border-line text-ink-700 hover:border-brand-green-500'}`}
              >
                <input
                  type="checkbox"
                  className="hidden"
                  checked={v.featureTags.includes(t)}
                  onChange={() => toggleArray('featureTags', t)}
                />
                {v.featureTags.includes(t) ? '✓ ' : ''}{t}
              </label>
            ))}
          </div>
          <p className="text-xs text-ink-500 mt-2">屬於政府或公信力認證的標籤，前台會以綠色顯示。</p>
        </Field>

        <Field label="自由特色標籤">
          <CustomTagsInput
            value={v.featureTags.filter((t) => !POLICY_TAGS.includes(t))}
            onChange={(customs) => {
              const policy = v.featureTags.filter((t) => POLICY_TAGS.includes(t));
              update('featureTags', [...policy, ...customs]);
            }}
            suggestions={CUSTOM_SUGS}
          />
          <p className="text-xs text-ink-500 mt-2">
            描述物件的賣點（採光、近捷運、邊間…），前台會以橘色顯示。可從建議點選或自由輸入。
          </p>
        </Field>

        <Field label="現況特色描述">
          <textarea
            className="input-base resize-y min-h-[160px]"
            placeholder="請輸入描述..."
            value={v.description}
            maxLength={2500}
            onChange={(e) => update('description', e.target.value)}
          />
          <p className="text-xs text-ink-500 mt-1">已輸入 {v.description.length} 字，還剩 {2500 - v.description.length} 字</p>
        </Field>
      </Card>

      {/* === 照片 === */}
      <Card title="照片（最多 20 張，自動轉為 WebP）">
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => uploadFiles(e.target.files)}
          className="block text-sm"
        />
        {uploading && <p className="text-sm text-brand-orange-700 mt-2">上傳中...</p>}
        {v.images.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-4">
            {v.images.map((url, i) => (
              <div key={url} className="relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-full aspect-square object-cover rounded-lg border border-line" />
                <button type="button" onClick={() => removeImage(url)} className="absolute top-1 right-1 bg-white/95 rounded-full w-7 h-7 grid place-items-center text-sm border border-line shadow-sm opacity-0 group-hover:opacity-100 transition">
                  <MaterialIcon name="close" className="text-base" />
                </button>
                {i === 0 && <span className="absolute bottom-1 left-1 bg-brand-green-700 text-white text-xs px-2 py-0.5 rounded-full font-bold">封面</span>}
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-ink-500 mt-2">第一張會作為列表的封面圖。所有檔案會自動轉換為 WebP 並儲存到 Railway 持久化儲存區。</p>
      </Card>

      {/* === 上下架 === */}
      <Card title="上下架設定">
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="上架狀態">
            <select className="input-base" value={v.status} onChange={(e) => update('status', e.target.value)}>
              <option value="active">上架中</option>
              <option value="inactive">下架</option>
              <option value="pending">審核中</option>
            </select>
            <p className="text-xs text-ink-500 mt-1">控制是否公開於前台</p>
          </Field>
          <Field label="刊登狀態">
            <select className="input-base" value={v.listingStatus} onChange={(e) => update('listingStatus', e.target.value)}>
              {LISTING_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <p className="text-xs text-ink-500 mt-1">前台卡片左上角 badge 顯示</p>
          </Field>
          <Field label="精選">
            <label className="inline-flex items-center gap-2 text-sm h-[42px]">
              <input type="checkbox" checked={v.featured} onChange={(e) => update('featured', e.target.checked)} />
              設為精選物件（在首頁與列表優先顯示）
            </label>
          </Field>
        </div>
      </Card>

      {/* 底部固定送出列 */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white border-t border-line px-4 py-3 z-20">
        <div className="max-w-[1200px] mx-auto flex justify-end gap-2">
          <button type="button" onClick={() => router.push('/admin/properties')} className="btn btn-secondary">取消</button>
          <button type="submit" disabled={saving} className="btn btn-primary">{saving ? '儲存中...' : (propertyId ? '儲存修改' : '建立物件')}</button>
        </div>
      </div>
    </form>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="admin-card">
      <h2 className="font-bold text-lg mb-4 pb-3 border-b border-line">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="label-base">
        {required && <span className="text-red-500">* </span>}
        {label}
      </label>
      {children}
    </div>
  );
}

function CustomTagsInput({
  value,
  onChange,
  suggestions,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  suggestions: readonly string[];
}) {
  const [input, setInput] = useState('');

  function addTag(raw: string) {
    const t = raw.trim();
    if (!t) return;
    if (value.includes(t)) return;
    onChange([...value, t]);
    setInput('');
  }

  function removeTag(t: string) {
    onChange(value.filter((x) => x !== t));
  }

  const unused = suggestions.filter((s) => !value.includes(s));

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2 min-h-[36px] px-2 py-2 rounded-lg border border-line bg-paper">
        {value.length === 0 && (
          <span className="text-xs text-ink-300 px-1">尚未加入特色標籤</span>
        )}
        {value.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 bg-brand-orange-50 text-brand-orange-700 text-xs px-2.5 py-1 rounded-full border border-brand-orange-300/40"
          >
            {t}
            <button
              type="button"
              onClick={() => removeTag(t)}
              className="hover:text-brand-orange-900"
              aria-label={`移除 ${t}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          className="input-base flex-1"
          placeholder="輸入後按 Enter 加入新標籤"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              addTag(input);
            }
          }}
        />
        <button
          type="button"
          onClick={() => addTag(input)}
          disabled={!input.trim()}
          className="btn btn-secondary text-sm whitespace-nowrap disabled:opacity-50"
        >
          加入
        </button>
      </div>

      {unused.length > 0 && (
        <div className="mt-2.5">
          <p className="text-xs text-ink-500 mb-1">建議標籤：</p>
          <div className="flex flex-wrap gap-1.5">
            {unused.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => addTag(s)}
                className="text-xs text-ink-700 px-2.5 py-1 rounded-full bg-paper-2 border border-line hover:bg-brand-orange-50 hover:border-brand-orange-300 hover:text-brand-orange-700 transition"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
