---
name: 鼎立租售管理 — Design System
description: 從 tailwind.config.js / globals.css / 元件實作抽出的視覺系統，Google Stitch 格式
last_documented: 2026-05-05
sources:
  - tailwind.config.js
  - src/app/globals.css
  - src/components/frontend/PropertyCard.tsx
  - src/components/frontend/Header.tsx
  - src/lib/property-tags.ts
---

# Dingli Design System

> 此文件 **記錄已存在的決策**，不發明新 token。增加新 token 前要先在 code 落地，再回來更新本檔。
> 若與 `tailwind.config.js` / `globals.css` 衝突，以 code 為準。

---

## 1. Brand

- **名稱**：鼎立租售管理（Dingli Rental Service）
- **網域**：dingli-rental.com
- **Logo**：`/public/LOGO_0.png`（橫式，44px 高，最大寬度 220px，於 `Header` 用 `next/image priority`）
- **語氣關鍵字**：年輕活潑、在地、可信賴（不端著、不像信義永慶）

## 2. Color Palette

色彩用 OKLCH 思考但以 hex 落地。所有 token 已在 `tailwind.config.js` 註冊並在 `globals.css` 以 CSS variable 對映。

### Brand — Green（主色，信任 / 確認 / 連結）

| Token | Hex | 用途 |
|---|---|---|
| `brand-green-900` | `#1f6f23` | 標題 / hover-darker / logo 對比 |
| `brand-green-700` | `#2e9d2f` | 主 CTA 背景、active 狀態徽章、連結 hover |
| `brand-green-500` | `#51b65a` | input focus ring、輔助強調 |
| `brand-green-50`  | `#ecf7ec` | eyebrow 底色、policy tag 底色 |

### Brand — Orange（次色，行動 / 特色 / 詢問導引）

| Token | Hex | 用途 |
|---|---|---|
| `brand-orange-700` | `#e08a0a` | btn-orange hover、orange tag 文字 |
| `brand-orange-500` | `#f39c12` | btn-orange、featured 徽章、數字強調 |
| `brand-orange-300` | `#ffc864` | service card 反白文字 |
| `brand-orange-50`  | `#fff4e0` | feature tag 底色 |
| `brand-orange-600` | （程式碼引用，未在 config 定義）| `LISTING_STATUS_CLASS.sold` 用到 — **TODO**：補進 config 或改用 `-700` |

### Ink（文字色階，帶綠的暖墨，**非中性灰**）

| Token | Hex | 用途 |
|---|---|---|
| `ink-900` | `#1a2421` | body 預設 / 主標題 |
| `ink-700` | `#3a4541` | 段落內文 / 表單 label |
| `ink-500` | `#6b7570` | 次要說明 / metadata（地址、坪數圖示行） |
| `ink-300` | `#b9beba` | disabled / placeholder / 空圖佔位符 |

### Surface（紙色，奶油色暖底，**不要 fallback 到 #fff**）

| Token | Hex | 用途 |
|---|---|---|
| `paper` | `#fffdf8` | body 預設背景、header 半透明底（`bg-paper/90`） |
| `paper-2` | `#f7f3ea` | 區塊分隔底色、code 背景、空圖佔位、legal info card |
| `line` | `#e6e1d4` | border 分隔線（卡片邊、表格、表單） |
| 純白 `#fff` | — | 卡片背景（PropertyCard、admin-card），與 paper 形成層次 |

### Tone Palette（語意色，限用於 tag / status）

定義在 `src/lib/property-tags.ts` 的 `TONE_CLASS`。**不要拿來做主視覺**，僅用於資訊分類：

| Tone | 語意 | Tailwind |
|---|---|---|
| `green` | 制度型、可信、新成屋（社會住宅、租金補貼、新成屋、屋齡 10 年內） | `bg-brand-green-50 text-brand-green-900 border-brand-green-500/30` |
| `orange` | 特色 / 機能（寵物友善、可開伙、自訂特色） | `bg-brand-orange-50 text-brand-orange-700 border-brand-orange-300/40` |
| `blue` | 設備（電梯） | `bg-blue-50 text-blue-700 border-blue-200/60` |
| `purple` | 位置加分（近捷運、學區、邊間、採光） | `bg-purple-50 text-purple-700 border-purple-200/60` |
| `gray` | 中性 fallback | `bg-paper-2 text-ink-700 border-line` |

### Listing Status

| Status | 配色 |
|---|---|
| `active` 出租中 | `bg-brand-green-700 text-white` |
| `rented` 已出租 | `bg-ink-700 text-white` |
| `sold` 售出 | `bg-brand-orange-600 text-white`（待修：`-600` 未定義） |
| `closed` 結束 | `bg-ink-300 text-ink-700` |

### 反鼎立色彩（不要出現）

- 純黑 `#000` / 純白 `#fff` 大面積（需要時用 `paper` / `ink-900`）
- 紅色 primary（信義房屋連鎖店感）
- 黃色 highlight（永慶連鎖店感）
- 紫到青漸層（AI 新創 tell）
- 中性灰（會洗掉暖色身分）

---

## 3. Typography

### Font Stack

```css
font-family: "Noto Sans TC", "Plus Jakarta Sans", -apple-system,
             BlinkMacSystemFont, "Segoe UI", sans-serif;
```

- **zh** 走 Noto Sans TC（已透過 fallback 跳過系統優先）。
- **en / ja** 走 Plus Jakarta Sans → 系統字。**已知問題**：Noto Sans TC 渲染英日文偏弱，`/impeccable polish` 處理多語頁時要驗證 en/ja 的字寬與 ascender/descender 是否被壓扁。
- 不要把字型換成 Inter / Roboto（會掉品牌個性）。

### Body Defaults

- `font-size`: 16px（瀏覽器預設）
- `line-height`: **1.7**（globals.css `body`）— 比常規 1.5 寬，是鼎立呼吸感的一部分
- `color`: `--ink-900`
- `background`: `--paper`
- `-webkit-font-smoothing: antialiased`

### Type Scale（觀察自實作，採用 Tailwind 類別）

| 用途 | 類別 | 大小 / 權重 |
|---|---|---|
| **Page Hero H1** | `text-4xl md:text-5xl lg:text-[56px] font-black leading-tight` | 36 → 48 → 56 / 900 |
| **Section H2** | `text-3xl sm:text-4xl font-black leading-tight` | 30 → 36 / 900 |
| **Card 標題（價格 display）** | `text-2xl font-black tracking-tight` | 24 / 900 |
| **Sub-title H3** | `text-lg font-extrabold` | 18 / 800 |
| **Card 物件名（H4）** | `text-base font-bold line-clamp-1` | 16 / 700 |
| **Body 大** | `text-lg text-ink-700 leading-relaxed` | 18 / 400 |
| **Body 預設** | `text-base text-ink-700` | 16 / 400 |
| **Body 小 / metadata** | `text-sm text-ink-500` | 14 / 400 |
| **Eyebrow / Badge / 狀態** | `text-xs font-bold tracking-wide` | 12 / 700 |
| **Tag pill** | `text-[11px] font-medium` | 11 / 500 |

**權重階梯**：年輕活潑來自 `font-black`（900）對 `font-medium`（500）的強對比，**不是**色彩或裝飾。section heading 預設用 `font-black`，不要降到 700。

**字級階梯比例**：≥ 1.25（已滿足）。不要往中間塞 `text-[15px]` 這類細粒度。

### 法律文件 / 長文（`.legal-prose`）

定義於 `globals.css`：

- H2: `text-xl sm:text-2xl font-extrabold` + 底線分隔
- p: `leading-relaxed text-sm sm:text-base`
- 列表 disc / decimal、code 用 `bg-paper-2`
- 連結：`text-brand-green-700 underline hover:text-brand-green-900`

---

## 4. Spacing & Layout

### Container

```
.container-page = w-full max-w-[1200px] mx-auto px-6
```

桌機最大寬 1200px，左右常駐 24px 留白（`px-6`）。所有頁面層級（前台 + 後台）都用這個。

### 斷點（Tailwind 預設）

| 名稱 | 最小寬 | 用途 |
|---|---|---|
| `sm` | 640px | 平板直立、文字升 base |
| `md` | 768px | **桌面 / 行動切換點**（Header、Nav、後台 sidebar） |
| `lg` | 1024px | Hero H1 升 56px、grid 列數加大 |
| `xl` | 1280px | 不常用 |

### Header

- 高度：`h-[76px]`（sticky top-0 z-50）
- 背景：`bg-paper/90 backdrop-blur-md`
- 下緣：`border-b border-line`
- mobile menu 切換點：`md`（768px）

### Card 內距

- **PropertyCard**：image area `aspect-[4/3]`，內容區 `p-5`
- **admin-card**：`bg-white rounded-xl border border-line shadow-sm p-5 sm:p-6`
- 卡片之間：grid `gap-6`（24px）為基準

### Border Radius

| Token | 值 | 用途 |
|---|---|---|
| `rounded-full` | 9999px | btn / pill / dot / status badge |
| `rounded-lg` | **14px** | input / 小卡 / tag-with-border |
| `rounded-xl` | **22px** | property card / hero / admin-card |

不要再引入別的圓角值（如 8px / 12px / 16px / 20px），這個三段式是身分標記。

### Shadow（**綠染暖陰影，不是中性黑**）

```css
shadow-sm: 0 2px 6px  rgba(31, 111, 35, .06);
shadow-md: 0 8px 28px rgba(31, 111, 35, .10);
shadow-lg: 0 18px 50px rgba(31, 111, 35, .14);
```

card 預設 `shadow-sm`，hover 升到 `shadow-lg`。不要用 Tailwind 預設的灰陰影（會掉暖色身分）。

---

## 5. Components

> 所有預定義 utilities 在 `src/app/globals.css` 的 `@layer components`。

### Buttons

| Class | 用途 | 樣式 |
|---|---|---|
| `.btn` | base | `inline-flex rounded-full px-7 py-3.5 font-bold text-sm` |
| `.btn-primary` | 主要動作（看物件、確認） | `bg-brand-green-700 text-white shadow-sm`，hover 變 `green-900` + `translate-y-2px` |
| `.btn-secondary` | 次要動作（取消、返回、白底） | `bg-white text-brand-green-900 border border-brand-green-700` |
| `.btn-orange` | 詢問 / 強導向動作（聯絡我們、立即詢問） | `bg-brand-orange-500 text-white shadow-sm` |

**Header 主 CTA** 用 compact 變體：`btn btn-primary text-sm py-2.5 px-5`。

**階級規則**（呼應 PRODUCT.md 第 8 條）：
- 一個畫面只能有 **1 個** primary
- 詢問 / 聯絡 → orange（不是 primary）
- 取消 / 返回 / alt → secondary
- 不要每個按鈕都圓填。次要動作可以是純文字 link（`text-brand-green-700 hover:text-brand-green-900`）

### Eyebrow（小標 chip）

```html
<span class="eyebrow"><span class="dot"></span>關鍵字</span>
```

`bg-brand-green-50 text-brand-green-900 font-bold text-sm px-3.5 py-1.5 rounded-full tracking-wide`，內含 `dot` 為橘點。**section 開場專用**，不要拿去當 tag 用。

### Form Input

- `.input-base`：`px-3 py-2.5 rounded-lg border border-line bg-paper`
- focus：`border-brand-green-500 ring-2 ring-brand-green-500/20`
- `.label-base`：`text-sm font-semibold text-ink-700 mb-1.5`

### PropertyCard

```
border border-line bg-white rounded-xl overflow-hidden shadow-sm
hover: shadow-lg + -translate-y-1, duration-300
image: aspect-[4/3], group-hover:scale-105, duration-700
```

固定結構（不要重排）：
1. image area + 三個 absolute 徽章（status 左上 / featured 左上偏右 / 物件類型右上）
2. 內容區 `p-5`：價格（`text-2xl font-black brand-green-900`） → 物件名 → 地址行（📍 ink-500）→ tag pills → 規格行（🛏 🚿 📐，`pt-4 border-t border-line mt-auto`）

### TagPill

`text-[11px] font-medium px-2 py-0.5 rounded-full border` + `TONE_CLASS[tone]`。永遠帶 1px border、永遠 pill。

### Status Badge（image overlay）

`absolute top-3 left-3 text-xs font-bold px-3 py-1 rounded-full shadow-sm`，配色見 §2 Listing Status。

### Header / Nav

- desktop nav：`hidden md:flex gap-8`，`font-medium text-ink-700 hover:text-brand-green-700`
- mobile：`☰` / `✕` toggle，展開後 `flex-col gap-3 py-2`
- LanguageSwitcher 桌機 / 手機分件（`LanguageSwitcherDesktop` / `LanguageSwitcherMobile`）

### AnnouncementBar

支援五種動效模式（marquee / marquee-reverse / typewriter / blink / fade / pulse），由 `<div class="ann-{mode}">` 控制。後台可配置；前台必須讀 `prefers-reduced-motion` 收斂。

### AI Chat 觸發鈕

`.ai-glow-btn` — conic-gradient 流動邊框（綠 → 焦糖 → 蜂蜜 → 焦糖 → 綠），2.5s 線性循環。**鼎立識別資產，不要刪**。新增 AI 入口統一沿用此 class。

### Hero Carousel

```
.hero-carousel: aspect-ratio 16/11, rounded-xl, shadow-lg
.hero-slide: opacity 0 → 1, 1s ease-in-out
.hero-dots: 8px → 24px (active), bottom 16px center
```

### Testimonial Marquee

`.testimonial-marquee` 套 `mask-image` 兩端淡出 + `.testimonial-track` 44s 無限循環。hover 暫停。卡片寬 `min(86vw, 360px)`、min-height 260px、line-clamp-5。

### Admin Shell

後台 `.admin-card` 是基礎卡。表單群組用 `admin-card` 包，間距 `space-y-6`。手機友善：`p-5 sm:p-6` 內距、所有 input 至少 44px tap target、CTA 全寬選用。

---

## 6. Motion

### 全域規則

- 只動 `transform` 和 `opacity`（**不要動** width / height / margin / padding）
- ease-out 用 exponential（quart / quint / expo）；可接受 linear（marquee / glow）
- **不要 bounce / elastic**
- 永遠 `@media (prefers-reduced-motion: reduce) { animation: none }`（已在 globals.css 全套套用）

### 已定義動效

| 名稱 | 時長 | 緩動 | 用途 |
|---|---|---|---|
| Card hover lift | 300ms | transition-all | shadow + `-translate-y-1` |
| Card image zoom | 700ms | transition-transform | `group-hover:scale-105` |
| Btn hover lift | default | transition | `translate-y-2px` + 變色 |
| Hero slide fade | 1000ms | ease-in-out | opacity |
| Header link | default | transition | `text-ink-700 → brand-green-700` |
| AI glow rotate | 2500ms | linear | conic-gradient `--ai-angle` |
| Testimonial marquee | 44000ms | linear infinite | translate3d |
| Announcement marquee | 22000ms | linear infinite | translate3d (LTR / RTL) |
| Announcement typewriter | 14000ms | steps(60) | max-width 0 → 100% → 0（**例外：動了 max-width，但是文字單行打字機效果，已驗收為個性訊號**） |
| Announcement blink | 1600ms | ease-in-out | opacity |
| Announcement fade | 3200ms | ease-in-out | opacity 0.55 ↔ 1 |
| Announcement pulse | 2000ms | ease-in-out | scale 1 ↔ 1.05 |

### 動效預算

新增動效前先問：「沒有它，使用者會迷失嗎？」如果答案是「不會，但好看」，且不是品牌個性訊號（marquee / glow / typewriter），就不要加。

---

## 7. Iconography

- **主圖示集**：Material Symbols Rounded（已在 globals.css 註冊 `.material-symbols-rounded` class），透過 `<MaterialIcon name="..." />` 使用
- **emoji 圖示**：PropertyCard 內 `📍 🛏 🚿 📐 ★` — 為視覺輕量保留，**不要**換成 Material Symbols（會變太正式）
- **logo**：`/public/LOGO_0.png`，固定 44px 高
- **不要引入** Heroicons / Lucide / Phosphor — 會破壞 Material Rounded + emoji 的混合語彙

---

## 8. Voice / UX Writing

承接 `PRODUCT.md` 品牌人格。**i18n 文案位於 `messages/{zh,en,ja}.json`，三語等價檢查是 ship 標準**。

### 規則

- 動詞優先（「找房子」不是「房屋查詢」、「立即詢問」不是「詢問送出」）
- 不用客套八股（不寫「敬請」「煩請」「謹此」「不便之處請見諒」）
- 數字大方（「200+ 物件」比「我們有許多物件」好）
- CTA 短：1–4 字最佳（「看物件」「立即詢問」「找房子」）
- 不誇張：別寫「全台最大」「No.1」（鼎立的可信靠在地，不靠 superlative）

### Empty State

不要只寫「沒有資料」。教使用者怎麼往前一步：
- ❌「暫無物件」
- ✅「目前條件下沒有符合的物件，試試放寬租金或鄉鎮區。」

---

## 9. Reference & Drift

- `tailwind.config.js` — color / radii / shadow / font tokens（**唯一真實**）
- `src/app/globals.css` — utilities + 所有動效 keyframes
- `src/lib/property-tags.ts` — tone 對映、policy tag 名單
- `messages/{zh,en,ja}.json` — i18n
- 已知漂移：
  - `LISTING_STATUS_CLASS.sold` 用了 `bg-brand-orange-600`，但 config 只到 `-500` / `-700`。下次 polish 對齊。
  - PropertyCard 內 emoji 圖示混 Material Symbols Rounded — 視為設計決策，不是 bug。

---

新增 / 修改 token 流程：
1. 先在 `tailwind.config.js` 或 `globals.css` 落地。
2. 跑 `/impeccable polish` 對齊既有元件。
3. 回來更新本檔（直接改、不需要 PR review 文件本身）。
