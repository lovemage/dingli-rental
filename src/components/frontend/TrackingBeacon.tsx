'use client';

import { useEffect } from 'react';

type Props =
  | { kind: 'property'; propertyId: number }
  | { kind: 'home' };

/**
 * 進入首頁 / 物件詳細頁時送出一次 tracking beacon。
 *
 * - fire-and-forget（用 keepalive 確保使用者立刻關頁時也能送出）
 * - 失敗一律靜默，不影響使用者體驗
 * - admin 後台路徑（/admin/*）由 layout 本身就不掛 beacon，這裡不需特別擋
 */
export default function TrackingBeacon(props: Props) {
  useEffect(() => {
    const url =
      props.kind === 'property' ? '/api/track/property-view' : '/api/track/site-visit';
    const body =
      props.kind === 'property' ? JSON.stringify({ propertyId: props.propertyId }) : '{}';

    void fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {});
    // 只在 mount 觸發一次（重新整理 = 新 mount，自然重新觸發）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
