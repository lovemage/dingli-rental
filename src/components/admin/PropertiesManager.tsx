'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { type MouseEvent, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import MaterialIcon from '@/components/admin/MaterialIcon';
import { type AdminPropertySort, sortAdminProperties } from '@/lib/admin-property-sort';
import { PROPERTY_SORT_OPTIONS } from '@/lib/property-sort';
import { LISTING_STATUS_BADGE, type ListingStatus } from '@/lib/property-status';
import { formatFloorLine } from '@/lib/property-floor';

const TOOL_BUTTON_CLASS = 'inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold whitespace-nowrap transition sm:text-xs';
const TOOL_BUTTON_NEUTRAL_CLASS = `${TOOL_BUTTON_CLASS} border-line bg-white text-ink-700 hover:border-brand-green-500 hover:text-brand-green-700`;
const ACTION_BUTTON_BASE = 'inline-flex items-center justify-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-50';
const ACTION_BUTTON_SIZE_CARD = 'h-7 w-7 sm:h-auto sm:w-auto sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-xs sm:font-semibold';
const ACTION_BUTTON_SIZE_COMPACT = 'h-7 w-7 sm:h-8 sm:w-8';
const ACTION_ICON_CLASS = '!text-base sm:!text-lg';
const ACTION_BUTTON_TONES = {
  neutral: 'border-line bg-white text-ink-700 hover:border-brand-green-500 hover:text-brand-green-700',
  accent: 'border-brand-orange-200 bg-brand-orange-50 text-brand-orange-700 hover:bg-brand-orange-100',
  success: 'border-brand-green-200 bg-brand-green-50 text-brand-green-700 hover:bg-brand-green-100',
  danger: 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100',
} as const;
const VIEW_TOGGLE_CLASS = 'hidden h-9 w-9 items-center justify-center rounded-xl border border-line bg-white text-ink-700 shadow-sm transition hover:border-brand-green-500 hover:text-brand-green-700 sm:inline-flex';
const TOP_CONTROL_CLASS = 'inline-flex h-9 items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition';
const TAB_BUTTON_CLASS = 'inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap transition sm:h-9 sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-xs';

type ViewTab = 'active' | 'inactive' | 'featured' | 'general';

type PropertyItem = {
  id: number;
  code?: string | null;
  title: string;
  region: string;
  district: string;
  street?: string | null;
  lane?: string | null;
  alley?: string | null;
  number?: string | null;
  numberSub?: string | null;
  typeMid: string;
  rent: number;
  usableArea: number;
  rooms: number;
  livingRooms: number;
  openLayout?: boolean | null;
  floorType?: string | null;
  floor?: string | null;
  totalFloor?: string | null;
  parkingType?: string | null;
  managementFee?: number | null;
  noManagementFee?: boolean;
  status: string;
  listingStatus?: string | null;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  inactiveAt?: string | null;
  imageUrl: string | null;
  monthViews: number;
  totalViews: number;
};

function fmtDate(dateIso?: string | null) {
  if (!dateIso) return '—';
  const d = new Date(dateIso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function formatFullAddress(p: Pick<PropertyItem, 'region' | 'district' | 'street' | 'lane' | 'alley' | 'number' | 'numberSub'>) {
  return `${p.region}${p.district}${p.street || ''}${p.lane ? `${p.lane}巷` : ''}${p.alley ? `${p.alley}弄` : ''}${p.number ? `${p.number}號` : ''}${p.numberSub ? `之${p.numberSub}` : ''}`;
}

function getStatusBadge(item: Pick<PropertyItem, 'status' | 'listingStatus'>) {
  if (item.status !== 'active') {
    return { label: '已下架', className: 'bg-paper-2 text-ink-700' };
  }
  const status = item.listingStatus;
  if (status === 'rented' || status === 'sold' || status === 'closed') {
    return LISTING_STATUS_BADGE[status as ListingStatus];
  }
  return LISTING_STATUS_BADGE.active;
}

/**
 * 「精選」分頁的預設排序：
 * 1. 精選物件優先；
 * 2. 同類別內按最近一次更新時間（updatedAt）倒序，
 *    這樣後台一更新物件就會自動置頂。
 */
function sortByFeaturedThenUpdatedAt(items: PropertyItem[]) {
  return [...items].sort((a, b) => {
    const aFeatured = a.featured ? 1 : 0;
    const bFeatured = b.featured ? 1 : 0;
    if (aFeatured !== bFeatured) return bFeatured - aFeatured;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

/**
 * 「精選 / 一般」分頁的預設排序：
 * 1. 上架中（active）優先於下架；
 * 2. 同狀態內按最近一次更新時間（updatedAt）倒序，
 *    這樣後台一更新物件就會自動置頂。
 */
function sortByActiveThenRecentUpdate(items: PropertyItem[]) {
  return [...items].sort((a, b) => {
    const aActive = a.status === 'active' ? 1 : 0;
    const bActive = b.status === 'active' ? 1 : 0;
    if (aActive !== bActive) return bActive - aActive;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

export default function PropertiesManager({
  initialItems,
  monthStr,
  q,
  minRent,
  maxRent,
}: {
  initialItems: PropertyItem[];
  monthStr: string;
  q: string;
  minRent: string;
  maxRent: string;
}) {
  const ACTIVE_PAGE_SIZE = 30;
  const INACTIVE_PAGE_SIZE = 20;
  const FEATURED_PAGE_SIZE = 30;
  const GENERAL_PAGE_SIZE = 30;

  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab: ViewTab = (() => {
    const raw = searchParams?.get('tab');
    return raw === 'inactive' || raw === 'featured' || raw === 'general' || raw === 'active'
      ? raw
      : 'active';
  })();

  // 即時篩選用的本地 controlled state（取代原本的 form submit 流程）
  const [qInput, setQInput] = useState(q);
  const [minRentInput, setMinRentInput] = useState(minRent);
  const [maxRentInput, setMaxRentInput] = useState(maxRent);
  const [rentPopoverOpen, setRentPopoverOpen] = useState(false);
  const [, startTransition] = useTransition();
  const filterDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rentPopoverRef = useRef<HTMLDivElement | null>(null);

  const [items, setItems] = useState(initialItems);
  // initialItems 來自 server，router.replace 後會帶回新一輪結果。
  // 用 React 官方的「Adjusting state when prop changes」render-phase pattern
  // 把 server 資料同步進 items state，避免租金 popover 套用後畫面仍卡在舊清單。
  // 注意：toggleFeatured / updateStatus 的 optimistic update 之後，server response
  // 也會走進 setItems()，下次 router.refresh 帶回的 initialItems 會跟它一致，
  // 因此這個 sync 不會把 optimistic 更新蓋掉。
  const [trackedInitial, setTrackedInitial] = useState(initialItems);
  if (trackedInitial !== initialItems) {
    setTrackedInitial(initialItems);
    setItems(initialItems);
  }
  const [activeTab, setActiveTab] = useState<ViewTab>(initialTab);
  const [pending, setPending] = useState<number | null>(null);
  const [activePage, setActivePage] = useState(1);
  const [inactivePage, setInactivePage] = useState(1);
  const [featuredPage, setFeaturedPage] = useState(1);
  const [generalPage, setGeneralPage] = useState(1);
  const [activeSort, setActiveSort] = useState<AdminPropertySort | ''>('');
  const [inactiveSort, setInactiveSort] = useState<AdminPropertySort | ''>('');
  const [featuredSort, setFeaturedSort] = useState<AdminPropertySort | ''>('');
  const [generalSort, setGeneralSort] = useState<AdminPropertySort | ''>('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedShareId, setCopiedShareId] = useState<number | null>(null);
  const [desktopViewMode, setDesktopViewMode] = useState<'card' | 'compact'>('compact');
  const listTopRef = useRef<HTMLDivElement | null>(null);

  const activeItems = useMemo(() => items.filter((x) => x.status === 'active'), [items]);
  const inactiveItems = useMemo(() => items.filter((x) => x.status !== 'active'), [items]);
  const featuredTabItems = useMemo(
    () => items.filter((x) => x.status === 'active'),
    [items],
  );
  const featuredOnlyCount = useMemo(
    () => items.filter((x) => x.featured).length,
    [items],
  );
  // 「一般」分頁僅顯示上架中的非精選物件；已下架的會出現在「下架」分頁。
  const generalItems = useMemo(
    () => items.filter((x) => !x.featured && x.status === 'active'),
    [items],
  );

  const sortedActiveItems = useMemo(
    () => (activeSort ? sortAdminProperties(activeItems, activeSort) : activeItems),
    [activeItems, activeSort],
  );

  const sortedInactiveDefaultItems = useMemo(() => {
    const priority = (item: PropertyItem) => (item.listingStatus === 'sold' ? 0 : 1);
    return [...inactiveItems].sort((a, b) => {
      const priorityDiff = priority(a) - priority(b);
      if (priorityDiff !== 0) return priorityDiff;
      const aInactiveAt = new Date(a.inactiveAt || a.createdAt).getTime();
      const bInactiveAt = new Date(b.inactiveAt || b.createdAt).getTime();
      return bInactiveAt - aInactiveAt;
    });
  }, [inactiveItems]);

  const sortedInactiveItems = useMemo(
    () => (inactiveSort ? sortAdminProperties(sortedInactiveDefaultItems, inactiveSort) : sortedInactiveDefaultItems),
    [inactiveSort, sortedInactiveDefaultItems],
  );

  const sortedFeaturedDefaultItems = useMemo(
    () => sortByFeaturedThenUpdatedAt(featuredTabItems),
    [featuredTabItems],
  );

  const sortedFeaturedItems = useMemo(
    () => (featuredSort ? sortAdminProperties(sortedFeaturedDefaultItems, featuredSort) : sortedFeaturedDefaultItems),
    [featuredSort, sortedFeaturedDefaultItems],
  );

  const sortedGeneralDefaultItems = useMemo(
    () => sortByActiveThenRecentUpdate(generalItems),
    [generalItems],
  );

  const sortedGeneralItems = useMemo(
    () => (generalSort ? sortAdminProperties(sortedGeneralDefaultItems, generalSort) : sortedGeneralDefaultItems),
    [generalSort, sortedGeneralDefaultItems],
  );

  const activeTotalPages = Math.max(1, Math.ceil(sortedActiveItems.length / ACTIVE_PAGE_SIZE));
  const inactiveTotalPages = Math.max(1, Math.ceil(sortedInactiveItems.length / INACTIVE_PAGE_SIZE));
  const featuredTotalPages = Math.max(1, Math.ceil(sortedFeaturedItems.length / FEATURED_PAGE_SIZE));
  const generalTotalPages = Math.max(1, Math.ceil(sortedGeneralItems.length / GENERAL_PAGE_SIZE));
  const safeActivePage = Math.min(activePage, activeTotalPages);
  const safeInactivePage = Math.min(inactivePage, inactiveTotalPages);
  const safeFeaturedPage = Math.min(featuredPage, featuredTotalPages);
  const safeGeneralPage = Math.min(generalPage, generalTotalPages);

  const pagedActiveItems = useMemo(() => {
    const start = (safeActivePage - 1) * ACTIVE_PAGE_SIZE;
    return sortedActiveItems.slice(start, start + ACTIVE_PAGE_SIZE);
  }, [safeActivePage, sortedActiveItems]);

  const pagedInactiveItems = useMemo(() => {
    const start = (safeInactivePage - 1) * INACTIVE_PAGE_SIZE;
    return sortedInactiveItems.slice(start, start + INACTIVE_PAGE_SIZE);
  }, [safeInactivePage, sortedInactiveItems]);

  const pagedFeaturedItems = useMemo(() => {
    const start = (safeFeaturedPage - 1) * FEATURED_PAGE_SIZE;
    return sortedFeaturedItems.slice(start, start + FEATURED_PAGE_SIZE);
  }, [safeFeaturedPage, sortedFeaturedItems]);

  const pagedGeneralItems = useMemo(() => {
    const start = (safeGeneralPage - 1) * GENERAL_PAGE_SIZE;
    return sortedGeneralItems.slice(start, start + GENERAL_PAGE_SIZE);
  }, [safeGeneralPage, sortedGeneralItems]);

  const rows =
    activeTab === 'active'
      ? pagedActiveItems
      : activeTab === 'inactive'
        ? pagedInactiveItems
        : activeTab === 'featured'
          ? pagedFeaturedItems
          : pagedGeneralItems;

  const currentSort =
    activeTab === 'active'
      ? activeSort
      : activeTab === 'inactive'
        ? inactiveSort
        : activeTab === 'featured'
          ? featuredSort
          : generalSort;

  const currentPage =
    activeTab === 'active'
      ? safeActivePage
      : activeTab === 'inactive'
        ? safeInactivePage
        : activeTab === 'featured'
          ? safeFeaturedPage
          : safeGeneralPage;

  const totalPages =
    activeTab === 'active'
      ? activeTotalPages
      : activeTab === 'inactive'
        ? inactiveTotalPages
        : activeTab === 'featured'
          ? featuredTotalPages
          : generalTotalPages;

  async function updateStatus(
    id: number,
    status: 'active' | 'inactive',
    listingStatus?: 'active' | 'rented' | 'sold' | 'closed',
  ) {
    setPending(id);
    try {
      const res = await fetch(`/api/properties/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, listingStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || '更新狀態失敗');
      setItems((prev) => {
        const next = prev.map((it) => (
          it.id === id
            ? {
                ...it,
                status: data.status,
                listingStatus: data.listingStatus ?? it.listingStatus,
                inactiveAt: data.inactiveAt ? new Date(data.inactiveAt).toISOString() : null,
                createdAt: data.createdAt ? new Date(data.createdAt).toISOString() : it.createdAt,
                updatedAt: data.updatedAt ? new Date(data.updatedAt).toISOString() : new Date().toISOString(),
                // 下架時 server 會把 featured 設為 false，這裡同步本地狀態
                featured: typeof data.featured === 'boolean' ? data.featured : it.featured,
              }
            : it
        ));
        return next.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      });
    } catch (error: any) {
      alert(error?.message || '更新失敗');
    } finally {
      setPending(null);
    }
  }

  async function toggleFeatured(id: number, currentFeatured: boolean) {
    setPending(id);
    try {
      const res = await fetch(`/api/properties/${id}/featured`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: !currentFeatured }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || '設定精選失敗');
      setItems((prev) =>
        prev.map((it) =>
          it.id === id
            ? { ...it, featured: Boolean(data.featured), updatedAt: data.updatedAt || new Date().toISOString() }
            : it,
        ),
      );
      if (!currentFeatured) {
        setFeaturedPage(1);
      }
    } catch (error: any) {
      alert(error?.message || '設定精選失敗');
    } finally {
      setPending(null);
    }
  }

  async function copyCode(code?: string | null) {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => {
        setCopiedCode((current) => (current === code ? null : current));
      }, 1200);
    } catch {
      alert('複製編號失敗');
    }
  }

  async function copyShareLink(id: number) {
    try {
      const url = new URL(`/properties/${id}`, window.location.origin).toString();
      await navigator.clipboard.writeText(url);
      setCopiedShareId(id);
      setTimeout(() => {
        setCopiedShareId((current) => (current === id ? null : current));
      }, 1200);
    } catch {
      alert('複製分享連結失敗');
    }
  }

  function handleCopyCode(event: MouseEvent<HTMLButtonElement>, code?: string | null) {
    event.preventDefault();
    void copyCode(code);
  }

  function handleCopyShare(event: MouseEvent<HTMLButtonElement>, id: number) {
    event.preventDefault();
    void copyShareLink(id);
  }

  // 立即把目前 (q, minRent, maxRent) 寫進 URL — 給「搜尋」按鈕 / 失焦事件 / 直接呼叫使用
  function applyFilterNow(nextQ: string, nextMin: string, nextMax: string) {
    if (filterDebounceRef.current) {
      clearTimeout(filterDebounceRef.current);
      filterDebounceRef.current = null;
    }
    const params = new URLSearchParams();
    if (nextQ.trim()) params.set('q', nextQ.trim());
    if (nextMin.trim()) params.set('minRent', nextMin.trim());
    if (nextMax.trim()) params.set('maxRent', nextMax.trim());
    if (monthStr) params.set('month', monthStr);
    const qs = params.toString();
    startTransition(() => {
      router.replace(`/admin/properties${qs ? `?${qs}` : ''}`, { scroll: false });
    });
  }

  // 關鍵字 q 用：debounce 後寫進 URL（避免每打一個字就 round-trip server）
  function scheduleFilterApply(nextQ: string, nextMin: string, nextMax: string) {
    if (filterDebounceRef.current) clearTimeout(filterDebounceRef.current);
    filterDebounceRef.current = setTimeout(() => {
      applyFilterNow(nextQ, nextMin, nextMax);
    }, 350);
  }

  function scrollListToTop() {
    if (typeof window === 'undefined') return;
    const target = listTopRef.current;
    if (target) {
      const rect = target.getBoundingClientRect();
      const offset = window.scrollY + rect.top - 16;
      window.scrollTo({ top: Math.max(0, offset), behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // 從 PropertyForm 儲存回來時帶有 ?tab=...，自動捲到列表頂端，
  // 讓剛存好的物件（已位於該分頁第一筆）一進畫面就看得到。
  useEffect(() => {
    if (!searchParams?.get('tab')) return;
    const timer = window.setTimeout(scrollListToTop, 60);
    return () => window.clearTimeout(timer);
    // 僅在首次掛載依 tab 滾動，後續使用者手動切分頁不重覆滾動
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 租金 popover：點外面收起來
  useEffect(() => {
    if (!rentPopoverOpen) return;
    function onPointer(e: PointerEvent) {
      if (rentPopoverRef.current && !rentPopoverRef.current.contains(e.target as Node)) {
        setRentPopoverOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setRentPopoverOpen(false);
    }
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [rentPopoverOpen]);

  function formatRentButtonLabel(): string {
    const min = minRentInput.trim();
    const max = maxRentInput.trim();
    if (!min && !max) return '租金';
    const fmt = (v: string) => `NT$${Number(v).toLocaleString()}`;
    if (min && max) return `${fmt(min)} – ${fmt(max)}`;
    if (min) return `${fmt(min)} 起`;
    return `≤ ${fmt(max)}`;
  }
  const hasRentFilter = minRentInput.trim() !== '' || maxRentInput.trim() !== '';

  function changePage(nextPage: number) {
    if (activeTab === 'active') {
      setActivePage(nextPage);
    } else if (activeTab === 'inactive') {
      setInactivePage(nextPage);
    } else if (activeTab === 'featured') {
      setFeaturedPage(nextPage);
    } else {
      setGeneralPage(nextPage);
    }
    scrollListToTop();
  }

  function changeSort(next: AdminPropertySort | '') {
    if (activeTab === 'active') {
      setActiveSort(next);
      setActivePage(1);
      return;
    }
    if (activeTab === 'inactive') {
      setInactiveSort(next);
      setInactivePage(1);
      return;
    }
    if (activeTab === 'featured') {
      setFeaturedSort(next);
      setFeaturedPage(1);
      return;
    }
    setGeneralSort(next);
    setGeneralPage(1);
  }

  const emptyText =
    activeTab === 'active'
      ? '目前沒有已上架物件'
      : activeTab === 'inactive'
        ? '目前沒有已下架物件'
        : activeTab === 'featured'
          ? '目前沒有精選物件'
          : '目前沒有一般物件';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="mb-1 text-xl font-black sm:text-2xl">物件管理</h1>
          <p className="text-xs text-ink-500 sm:text-sm">
            上架中 {activeItems.length} 筆 / 已下架 {inactiveItems.length} 筆 / 精選 {featuredOnlyCount} 筆 / 一般 {generalItems.length} 筆
          </p>
        </div>

        <div className="flex w-full flex-wrap items-center justify-end gap-2 lg:w-auto lg:flex-nowrap">
          {/* 即時篩選：所有輸入框經 350ms debounce 後直接更新 URL */}
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 lg:flex-none">
            {/* 租金：button 點開 popover 內含「最低 / 最高 / 搜尋」三件套 */}
            <div ref={rentPopoverRef} className="relative">
              <button
                type="button"
                onClick={() => setRentPopoverOpen((open) => !open)}
                aria-haspopup="dialog"
                aria-expanded={rentPopoverOpen}
                className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-full border px-3 text-xs font-semibold whitespace-nowrap transition sm:text-sm ${
                  hasRentFilter
                    ? 'border-brand-green-700 bg-brand-green-50 text-brand-green-800 hover:border-brand-green-700'
                    : 'border-line bg-white text-ink-700 hover:border-brand-green-500 hover:text-brand-green-700'
                }`}
              >
                <MaterialIcon name="payments" className="!text-sm" />
                <span>{formatRentButtonLabel()}</span>
                <MaterialIcon name="expand_more" className={`!text-sm transition ${rentPopoverOpen ? 'rotate-180' : ''}`} />
              </button>

              {rentPopoverOpen && (
                <div
                  role="dialog"
                  aria-label="租金範圍"
                  className="absolute left-0 z-40 mt-2 w-72 rounded-2xl border border-line bg-white p-4 shadow-lg sm:right-auto"
                >
                  <p className="mb-3 text-xs font-semibold text-ink-700 sm:text-sm">租金範圍</p>
                  <div className="flex items-center gap-2">
                    <label className="flex-1 min-w-0">
                      <span className="block text-[10px] text-ink-500 mb-1">最低</span>
                      <input
                        type="number"
                        value={minRentInput}
                        min={0}
                        inputMode="numeric"
                        placeholder="不限"
                        onChange={(e) => setMinRentInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            applyFilterNow(qInput, minRentInput, maxRentInput);
                            setRentPopoverOpen(false);
                          }
                        }}
                        className="h-9 w-full rounded-full border border-line bg-white px-3 text-sm focus:border-brand-green-500 focus:outline-none"
                      />
                    </label>
                    <span className="mt-5 text-ink-400">–</span>
                    <label className="flex-1 min-w-0">
                      <span className="block text-[10px] text-ink-500 mb-1">最高</span>
                      <input
                        type="number"
                        value={maxRentInput}
                        min={0}
                        inputMode="numeric"
                        placeholder="不限"
                        onChange={(e) => setMaxRentInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            applyFilterNow(qInput, minRentInput, maxRentInput);
                            setRentPopoverOpen(false);
                          }
                        }}
                        className="h-9 w-full rounded-full border border-line bg-white px-3 text-sm focus:border-brand-green-500 focus:outline-none"
                      />
                    </label>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-2">
                    {hasRentFilter ? (
                      <button
                        type="button"
                        onClick={() => {
                          setMinRentInput('');
                          setMaxRentInput('');
                          applyFilterNow(qInput, '', '');
                          setRentPopoverOpen(false);
                        }}
                        className="text-xs text-ink-500 underline hover:text-brand-green-700"
                      >
                        清除
                      </button>
                    ) : <span />}
                    <button
                      type="button"
                      onClick={() => {
                        applyFilterNow(qInput, minRentInput, maxRentInput);
                        setRentPopoverOpen(false);
                      }}
                      className="inline-flex items-center justify-center gap-1.5 rounded-full bg-brand-green-700 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-green-900 sm:text-sm"
                    >
                      <MaterialIcon name="search" className="!text-sm" />
                      搜尋
                    </button>
                  </div>
                </div>
              )}
            </div>
            <input
              type="text"
              value={qInput}
              placeholder="編號 / 標題 / 區域 / 路名"
              onChange={(e) => {
                const next = e.target.value;
                setQInput(next);
                scheduleFilterApply(next, minRentInput, maxRentInput);
              }}
              className="h-9 min-w-0 flex-1 rounded-full border border-line bg-white px-3 text-xs focus:border-brand-green-500 focus:outline-none sm:min-w-[220px] sm:text-sm"
            />
            {/* 行動裝置隱藏「新增物件」，桌機才顯示；側邊欄仍有相同入口 */}
            <Link
              href="/admin/properties/new"
              className={`${TOP_CONTROL_CLASS} border-brand-green-700 bg-brand-green-700 text-white hover:bg-brand-green-900 hidden sm:inline-flex`}
            >
              <MaterialIcon name="add" className="!text-sm" />
              新增物件
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setDesktopViewMode((current) => (current === 'card' ? 'compact' : 'card'))}
            className={VIEW_TOGGLE_CLASS}
            title={desktopViewMode === 'card' ? '切換為緊湊列表' : '切換為卡片列表'}
            aria-label={desktopViewMode === 'card' ? '切換為緊湊列表' : '切換為卡片列表'}
          >
            <MaterialIcon
              name={desktopViewMode === 'card' ? 'view_list' : 'grid_view'}
              className={ACTION_ICON_CLASS}
            />
          </button>
        </div>
      </div>

      <div className="admin-card !p-3 sm:!p-4" ref={listTopRef}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="-mx-1 flex min-w-0 flex-nowrap items-center gap-1.5 overflow-x-auto px-1 sm:flex-wrap sm:gap-2 [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => setActiveTab('active')}
              className={`${TAB_BUTTON_CLASS} ${
                activeTab === 'active'
                  ? 'border-brand-green-700 bg-brand-green-700 text-white'
                  : 'border-line bg-white text-ink-700 hover:border-brand-green-500 hover:text-brand-green-700'
              }`}
            >
              已上架（{activeItems.length}）
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('featured')}
              className={`${TAB_BUTTON_CLASS} ${
                activeTab === 'featured'
                  ? 'border-brand-orange-500 bg-brand-orange-500 text-white'
                  : 'border-brand-orange-200 bg-brand-orange-50 text-brand-orange-700 hover:bg-brand-orange-100'
              }`}
            >
              <MaterialIcon name="star" className="!text-xs sm:!text-sm" fill={activeTab === 'featured'} />
              精選（{featuredOnlyCount}）
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('inactive')}
              className={`${TAB_BUTTON_CLASS} ${
                activeTab === 'inactive'
                  ? 'border-brand-green-700 bg-brand-green-700 text-white'
                  : 'border-line bg-white text-ink-700 hover:border-brand-green-500 hover:text-brand-green-700'
              }`}
            >
              已下架（{inactiveItems.length}）
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('general')}
              className={`${TAB_BUTTON_CLASS} ${
                activeTab === 'general'
                  ? 'border-brand-green-700 bg-brand-green-700 text-white'
                  : 'border-line bg-white text-ink-700 hover:border-brand-green-500 hover:text-brand-green-700'
              }`}
            >
              <MaterialIcon name="star_outline" className="!text-xs sm:!text-sm" />
              一般（{generalItems.length}）
            </button>
          </div>

          <label className="flex items-center gap-2 text-xs sm:text-sm">
            <span className="whitespace-nowrap text-ink-500">排序</span>
            <select
              className="h-9 rounded-full border border-line bg-white px-3 text-xs focus:border-brand-green-500 focus:outline-none sm:min-w-[132px] sm:text-sm"
              value={currentSort}
              onChange={(e) => changeSort(e.target.value as AdminPropertySort | '')}
            >
              <option value="">選取</option>
              {PROPERTY_SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {ADMIN_SORT_LABELS[option.labelKey]}
                </option>
              ))}
            </select>
          </label>
        </div>

        {rows.length > 0 ? (
          <div className="mt-3 space-y-[3px] sm:space-y-3">
            {rows.map((p) => {
              const badge = getStatusBadge(p);
              const previewHref = `/properties/${p.id}`;

              const isCompact = desktopViewMode === 'compact';
              const actionSize = isCompact ? ACTION_BUTTON_SIZE_COMPACT : ACTION_BUTTON_SIZE_CARD;
              const actionBtn = (tone: keyof typeof ACTION_BUTTON_TONES) =>
                `${ACTION_BUTTON_BASE} ${actionSize} ${ACTION_BUTTON_TONES[tone]}`;
              const actionLabelClass = isCompact ? 'hidden' : 'hidden sm:inline';
              const fullAddress = formatFullAddress(p);
              const floorLine = formatFloorLine(p.floorType, p.floor, p.totalFloor);

              return (
                <article
                  key={p.id}
                  className={`flex flex-row gap-2 rounded-xl border border-line bg-white p-2 transition hover:border-brand-green-200 hover:bg-paper-2/30 sm:rounded-2xl sm:gap-3 sm:p-2.5 ${
                    isCompact
                      ? 'sm:flex-row sm:items-center sm:gap-3 sm:p-2'
                      : 'sm:flex-row sm:gap-4 sm:p-3'
                  }`}
                >
                  <Link
                    href={previewHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`relative block aspect-square w-20 shrink-0 overflow-hidden rounded-lg bg-paper-2 sm:rounded-xl ${
                      isCompact
                        ? 'sm:aspect-auto sm:h-16 sm:w-24'
                        : 'sm:aspect-[4/3] sm:w-36 lg:w-40'
                    }`}
                    title="新視窗預覽"
                  >
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imageUrl} alt={p.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-xs text-ink-300">—</div>
                    )}
                  </Link>

                  <div className={`flex min-w-0 flex-1 flex-col ${isCompact ? 'sm:flex-row sm:items-center sm:gap-3' : ''}`}>
                    <div className={`flex min-w-0 flex-1 flex-col ${isCompact ? 'sm:gap-1' : ''}`}>
                    <div className={`flex min-w-0 flex-col gap-1 sm:gap-2 ${isCompact ? 'sm:flex-row sm:items-center sm:gap-2' : ''}`}>
                    <div className={`flex flex-wrap items-center gap-1 sm:gap-1.5 ${isCompact ? 'sm:flex-nowrap sm:shrink-0' : ''}`}>
                      <span className={`${badge.className} rounded-full px-1.5 py-0.5 text-[10px] font-bold shadow-sm sm:px-2 sm:text-[11px]`}>
                        {badge.label}
                      </span>
                      <button
                        type="button"
                        disabled={pending === p.id}
                        onClick={() => toggleFeatured(p.id, p.featured)}
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold whitespace-nowrap shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 sm:px-2 sm:text-[11px] ${
                          p.featured
                            ? 'bg-brand-orange-500 text-white hover:bg-brand-orange-600'
                            : 'border border-line bg-paper text-ink-500 hover:border-brand-orange-300 hover:text-brand-orange-600'
                        }`}
                        title={p.featured ? '點擊取消精選，改為一般' : '點擊設為精選'}
                        aria-label={p.featured ? '取消精選' : '設為精選'}
                      >
                        {p.featured ? '★ 精選' : '一般'}
                      </button>
                      <span className={`hidden rounded-full border border-line bg-paper px-2 py-0.5 text-[10px] font-medium text-ink-700 sm:inline-block sm:text-[11px] ${isCompact ? 'sm:hidden' : ''}`}>
                        {p.typeMid}
                      </span>
                      {p.code && (
                        <button
                          type="button"
                          onClick={(event) => handleCopyCode(event, p.code)}
                          className={`inline-flex items-center gap-1 rounded-full border border-line bg-white px-1.5 py-0.5 text-[10px] font-mono font-bold text-ink-500 transition hover:border-brand-green-500 hover:text-brand-green-700 sm:px-2 sm:text-[11px] ${isCompact ? 'sm:hidden' : ''}`}
                          title="複製物件編號"
                        >
                          {p.code}
                          <span className="font-sans">{copiedCode === p.code ? '已複製' : '複製'}</span>
                        </button>
                      )}
                    </div>

                    <div className={`flex flex-wrap items-start gap-2 ${isCompact ? 'sm:min-w-0 sm:flex-1 sm:flex-nowrap sm:items-baseline sm:justify-start sm:gap-2' : 'justify-between'}`}>
                      <div className={`min-w-0 flex-1 ${isCompact ? 'sm:flex-initial sm:shrink' : ''}`}>
                        <div className="flex items-baseline gap-2">
                          <Link
                            href={previewHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`line-clamp-1 flex-1 text-sm font-bold text-ink-900 transition hover:text-brand-green-700 ${
                              isCompact ? 'sm:block sm:truncate sm:text-sm' : 'sm:line-clamp-2 sm:text-base'
                            }`}
                            title="新視窗預覽"
                          >
                            {p.title}
                          </Link>
                          <span className="shrink-0 text-xs font-black tracking-tight text-brand-green-900 sm:hidden">
                            NT$ {p.rent.toLocaleString()}
                          </span>
                        </div>
                        <p
                          className={`mt-0.5 line-clamp-1 text-[11px] text-ink-500 ${
                            isCompact ? 'sm:hidden' : 'sm:line-clamp-2 sm:text-xs'
                          }`}
                          title={fullAddress}
                        >
                          {fullAddress}
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-ink-600 sm:hidden">
                          <span>{p.openLayout ? '開放式' : `${p.rooms} 房 ${p.livingRooms} 廳`}</span>
                          <span className="text-ink-300">·</span>
                          <span>{p.usableArea.toLocaleString()} 坪</span>
                          {floorLine && (
                            <>
                              <span className="text-ink-300">·</span>
                              <span>{floorLine}</span>
                            </>
                          )}
                          {p.parkingType && (
                            <>
                              <span className="text-ink-300">·</span>
                              <span>有車位</span>
                            </>
                          )}
                        </div>
                        {!isCompact && (
                          <div className="mt-1.5 hidden flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-ink-600 sm:flex sm:text-xs">
                            <span className="text-base font-black tracking-tight text-brand-green-900 sm:text-lg">
                              NT$ {p.rent.toLocaleString()}
                            </span>
                            <span>{p.usableArea.toLocaleString()} 坪</span>
                            <span>{p.openLayout ? '開放式' : `${p.rooms} 房 ${p.livingRooms} 廳`}</span>
                            {floorLine && <span>{floorLine}</span>}
                            <span>{p.parkingType ? '有車位' : '無車位'}</span>
                          </div>
                        )}
                      </div>

                    </div>
                    </div>

                    {isCompact && (
                      <div className="hidden flex-col gap-1 text-[11px] text-ink-600 sm:flex">
                        <div className="flex items-center gap-x-3 whitespace-nowrap">
                          <span className="text-xs font-black tracking-tight text-brand-green-900">NT$ {p.rent.toLocaleString()}</span>
                          <span>{p.openLayout ? '開放式' : `${p.rooms} 房 ${p.livingRooms} 廳`}</span>
                          {floorLine && <span>{floorLine}</span>}
                          <span>{p.parkingType ? '有車位' : '無車位'}</span>
                          <span>{p.usableArea.toLocaleString()} 坪</span>
                          <span>瀏覽 {p.monthViews.toLocaleString()} / {p.totalViews.toLocaleString()}</span>
                          <span>上架 {fmtDate(p.createdAt)}</span>
                        </div>
                        <div className="truncate text-ink-500" title={fullAddress}>
                          <MaterialIcon name="location_on" className="!text-sm align-[-2px] mr-0.5" />
                          {fullAddress}
                        </div>
                      </div>
                    )}

                    <div className={`mt-1 hidden grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-ink-600 sm:grid sm:text-xs ${
                      isCompact
                        ? 'sm:hidden'
                        : activeTab === 'active'
                          ? 'sm:grid-cols-2'
                          : 'sm:grid-cols-2 xl:grid-cols-4'
                    }`}>
                      <p className="min-w-0 truncate">
                        <span className="sm:hidden">瀏覽 </span>
                        <span className="hidden sm:inline">月瀏覽 </span>
                        {p.monthViews.toLocaleString()}
                        <span className="text-ink-400"> / </span>
                        {p.totalViews.toLocaleString()}
                      </p>
                      <p className="min-w-0 truncate">
                        <span className="sm:hidden">上架 </span>
                        <span className="hidden sm:inline">上架時間 </span>
                        {fmtDate(p.createdAt)}
                      </p>
                      {activeTab !== 'active' && (
                        <p className="hidden min-w-0 truncate sm:block">下架時間 {p.status !== 'active' ? fmtDate(p.inactiveAt) : '—'}</p>
                      )}
                      {activeTab !== 'active' && (
                        <p className="hidden min-w-0 truncate sm:block">狀態 {badge.label}</p>
                      )}
                    </div>
                    </div>

                    <div className={`mt-2 flex flex-wrap items-center gap-1.5 border-t border-line pt-2 sm:mt-3 sm:gap-2 sm:pt-3 ${isCompact ? 'sm:mt-0 sm:shrink-0 sm:flex-nowrap sm:justify-end sm:border-t-0 sm:pt-0' : ''}`}>
                      <Link
                        href={`/admin/properties/${p.id}/edit`}
                        className={actionBtn('neutral')}
                        title="編輯"
                        aria-label="編輯"
                      >
                        <MaterialIcon name="edit" className={ACTION_ICON_CLASS} />
                        <span className={actionLabelClass}>編輯</span>
                      </Link>

                      <button
                        type="button"
                        onClick={(event) => handleCopyShare(event, p.id)}
                        className={actionBtn('neutral')}
                        title={copiedShareId === p.id ? '已複製連結' : '分享'}
                        aria-label={copiedShareId === p.id ? '已複製連結' : '分享'}
                      >
                        <MaterialIcon name={copiedShareId === p.id ? 'check' : 'share'} className={ACTION_ICON_CLASS} />
                        <span className={actionLabelClass}>{copiedShareId === p.id ? '已複製連結' : '分享'}</span>
                      </button>

                      <button
                        type="button"
                        disabled={pending === p.id}
                        onClick={() => toggleFeatured(p.id, p.featured)}
                        className={actionBtn(p.featured ? 'accent' : 'neutral')}
                        title={p.featured ? '取消精選' : '設為精選'}
                        aria-label={p.featured ? '取消精選' : '設為精選'}
                      >
                        <MaterialIcon name={p.featured ? 'star' : 'star_outline'} className={ACTION_ICON_CLASS} fill={p.featured} />
                        <span className={actionLabelClass}>{p.featured ? '取消精選' : '設為精選'}</span>
                      </button>

                      {p.status === 'active' ? (
                        <button
                          type="button"
                          disabled={pending === p.id}
                          onClick={() => updateStatus(p.id, 'inactive', 'rented')}
                          className={actionBtn('danger')}
                          title="成交下架"
                          aria-label="成交下架"
                        >
                          <MaterialIcon name="inventory_2" className={ACTION_ICON_CLASS} />
                          <span className={actionLabelClass}>成交下架</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={pending === p.id}
                          onClick={() => updateStatus(p.id, 'active', 'active')}
                          className={actionBtn('success')}
                          title="重新上架"
                          aria-label="重新上架"
                        >
                          <MaterialIcon name="published_with_changes" className={ACTION_ICON_CLASS} />
                          <span className={actionLabelClass}>重新上架</span>
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-sm text-ink-500">{emptyText}</div>
        )}

        {rows.length > 0 && totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={changePage}
          />
        )}
      </div>
    </div>
  );
}

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

const PAGE_BUTTON_CLASS = `${TOOL_BUTTON_CLASS} border-line bg-white text-ink-700 hover:border-brand-green-500 hover:text-brand-green-700`;
const PAGE_BUTTON_ACTIVE_CLASS = `${TOOL_BUTTON_CLASS} border-brand-green-500 bg-brand-green-50 text-brand-green-700 font-bold`;

type PageEntry = {
  value: number | '...';
  hideOnMobile: boolean;
};

function getPageNumbers(current: number, total: number): PageEntry[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => ({
      value: i + 1,
      hideOnMobile: false,
    }));
  }

  const entries: PageEntry[] = [];
  const push = (v: number | '...', hideOnMobile: boolean) => entries.push({ value: v, hideOnMobile });

  push(1, false);

  let start = Math.max(2, current - 1);
  let end = Math.min(total - 1, current + 1);

  if (current <= 3) {
    start = 2;
    end = 5;
  } else if (current >= total - 2) {
    start = total - 4;
    end = total - 1;
  }

  if (start > 2) push('...', false);
  for (let i = start; i <= end; i++) {
    push(i, Math.abs(i - current) > 1);
  }
  if (end < total - 1) push('...', Math.abs(end - current) > 1);

  push(total, false);
  return entries;
}

function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const pages = getPageNumbers(currentPage, totalPages);

  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-2 border-t border-line pt-4">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={PAGE_BUTTON_CLASS}
      >
        上一頁
      </button>

      {pages.map((entry, idx) => {
        if (entry.value === '...') {
          return (
            <span
              key={`dot-${idx}`}
              className={`px-1 text-xs text-ink-400${entry.hideOnMobile ? ' hidden sm:inline' : ''}`}
            >
              ...
            </span>
          );
        }
        return (
          <button
            key={entry.value}
            type="button"
            onClick={() => onPageChange(entry.value as number)}
            className={`${entry.value === currentPage ? PAGE_BUTTON_ACTIVE_CLASS : PAGE_BUTTON_CLASS}${entry.hideOnMobile ? ' hidden sm:inline-flex' : ''}`}
          >
            {entry.value}
          </button>
        );
      })}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={PAGE_BUTTON_CLASS}
      >
        下一頁
      </button>
    </div>
  );
}

const ADMIN_SORT_LABELS: Record<(typeof PROPERTY_SORT_OPTIONS)[number]['labelKey'], string> = {
  sortRentDesc: '租金高到低',
  sortRentAsc: '租金低到高',
  sortCreatedDesc: '新到舊',
  sortCreatedAsc: '舊到新',
  sortAreaDesc: '坪數大到小',
  sortAreaAsc: '坪數小到大',
};
