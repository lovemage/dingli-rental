---
name: 鼎立租售管理 — Product Context
description: 北北基桃竹租賃網站的策略上下文：register、TA、品牌人格、反參考、設計原則
last_reviewed: 2026-05-05
---

# 鼎立租售管理（Dingli Rental）

> 北北基桃竹（台北 / 新北 / 基隆 / 桃園 / 新竹）的住宅租賃服務。
> 網域：dingli-rental.com｜技術棧：Next.js 16 / Prisma / PostgreSQL / Cloudinary。

## Register（雙模式）

這個專案有兩個明確分離的設計領域，所有 `/impeccable` 指令必須先判斷自己在哪一邊：

- **brand**（主導）— 路徑 `/[locale]/...`：首頁、物件搜尋、物件詳情、服務、人才、聯絡、條款。
  設計 **是** 產品。任務是建立信任、轉化詢問、撐住三語體驗。
- **product** — 路徑 `/admin/(panel)/...`：物件 CRUD、輪播管理、詢問管理、文案/AI 設定。
  設計 **服務於** 任務效率。資訊密度可以更高，但必須手機友善（管理者常在外面看屋現場用）。

判斷規則：路由含 `/admin` → product；其他 → brand。

## Audience（目標用戶）

**主要對象：找房的承租人**（個人、學生、家庭、上班族、小公司）。

- 房東 / 屋主 **不是** 主要受眾。委託出租流程不需要在前台搶版面。
- 後台用戶是公司同事（少數人、每天用），UI 要可靠不要好看。

含義：
- 前台所有設計決策的 evaluation question 是「一個第一次來的承租人，會不會在 30 秒內想點某個物件 / 留下聯絡方式」。
- CTA 永遠優先給「看物件」「聯絡我們」「填詢問」這類動詞。

## Brand Personality

關鍵字：**年輕活潑**。

但「年輕活潑」**不等於** 換色票。鼎立的色彩資產（暖綠 + 蜂蜜橘 + 奶油紙 + 染綠暖陰影）已經很有辨識度，承租人對「在地、可靠」的暖色系反應比對冷色科技感好。年輕活潑要透過下面這些做出來：

- **節奏**：排版能量更高（更大標題、更明顯的 weight 對比、≥1.25 字級階梯）。
- **動效**：保留現有的 marquee / typewriter / glow，繼續用「動的東西」當個性訊號（已尊重 `prefers-reduced-motion`）。
- **微互動**：hover lift、按鈕反饋、輪播切換要有感，但不耍寶（不彈跳、不甩尾）。
- **語氣**：UX 文案口語、直接、不端著（不用「敬請」「煩請」「謹此」這類客套八股）。

## Anti-References（不要長得像）

- **信義房屋 / 永慶房屋**（最大的反參考）：紅黃連鎖店色塊、吊牌式物件卡、密集的「服務據點」「品牌承諾」徽章、企業集團感。
  - 我們不要紅色 primary、不要連鎖店一致性、不要把信任靠 logo 海撐起來。
- **591 / 樂屋網**：資訊密集藍色 portal、表格式列表、廣告位插滿。
  - 我們允許留白、允許單欄聚焦、允許每張物件卡呼吸。
- **過度科技感的 AI 新創**：紫到青漸層、玻璃擬態、深色預設、Inter 字型。
  - 我們是租屋，不是 SaaS。

## 三個月設計優先序

1. **(a) 提高物件詢問轉換** — 物件卡 → 詳情頁 → 詢問表單的整條漏斗。CTA 階級、價格與「看物件」的視覺距離、表單摩擦降低。
2. **(c) 多語體驗一致** — `en` / `ja` 不能比 `zh` 醜。重點：英日文的 line-height、字型 fallback（Noto Sans TC 對英日文不理想）、字數差異不爆版（中文常壓縮，英文常溢出）。
3. **(e) 後台操作效率** — `/admin` 手機可用、表單可預期、上傳順暢。設計上不追求華麗。

未列入但仍存在的：物件詳情閱讀體驗、SEO 速度。會在過程中順手照顧，不是專案。

## Motion Stance

**維持現狀偏多動效**。已存在動效（announcement marquee / typewriter / blink / fade / pulse、AI button conic-gradient glow、testimonial marquee、hero carousel fade）視為個性資產，不要在 audit / polish 時誤殺。

新增動效仍須遵守：
- 只動 `transform` 和 `opacity`（不要動 layout properties）。
- ease-out 用 exponential（quart / quint / expo），**不要** bounce / elastic。
- 持續尊重 `prefers-reduced-motion`。
- 動效要傳達狀態，不只是裝飾 — 但「個性訊號」（如 announcement、AI glow）算合法用途。

## Accessibility

**不追求 WCAG AA / AAA 的形式合規**。但保留下列底線（不是降低品質的藉口）：

- 所有互動元素鍵盤可達（Tab 順序合理、focus 可見）。
- 對比度不能比目前 `--ink-700 on --paper`（已 OK）更糟。
- 不要把唯一狀態訊號放在顏色上（例如 error 不只變紅）。
- `prefers-reduced-motion` 已支援，不要拿掉。

**不需要**為色弱、年長者眼力、螢幕閱讀器做額外延伸支援。

## Design Principles（從上面蒸餾，吵架時引用）

1. **暖色不換，但能量要拉。** 年輕活潑用 weight、size、節奏做，不是換成冷色。
2. **不要看起來像信義永慶。** 沒有紅色 primary、沒有徽章吊牌、沒有連鎖店感。
3. **承租人優先。** 出租委託、後台、品牌故事都讓位給「看物件 / 詢問」。
4. **多語三語等價。** 任何只在中文檢查過的設計不算 ship。
5. **手機後台不是次要。** `/admin` 必須在手機可用，因為管理者在現場用。
6. **動效是個性資產。** marquee / glow / typewriter 不是 slop，是鼎立的聲音；要刪先問。
7. **奶油紙不要變白。** `--paper: #fffdf8` 是身分標記，不要 fallback 到 `#fff`。
8. **CTA 階級要有。** 不是每個按鈕都 `.btn-primary`。次要 → secondary，導向詢問 → orange。

## Reference Files

- `tailwind.config.js` — color tokens、font stack、radii、shadows
- `src/app/globals.css` — utilities (`.btn-*`, `.eyebrow`, `.admin-card`, `.legal-prose`)、所有動效 keyframes
- `messages/{zh,en,ja}.json` — 多語文案
- `src/components/frontend/` — brand register 元件
- `src/components/admin/` — product register 元件
