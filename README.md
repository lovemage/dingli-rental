# 鼎立租售管理 Dingli Rental Service

基於 Next.js 16 (App Router) 的全棧租賃網站，包含前台展示、物件搜尋與後台管理（手機友善）。

- 網域：[dingli-rental.com](https://dingli-rental.com)
- 服務範圍：北北基桃竹（台北市、新北市、基隆市、桃園市、新竹市/縣）
- 技術棧：Next.js 16 / TypeScript / Tailwind CSS 4 / PostgreSQL / Prisma 7 / sharp（WebP 轉檔）

## 主要功能

### 前台
- 首頁 Hero 輪播（最多 3 張，可後台調整切換秒數）
- 物件分類 / 服務特色 / 人才招募 / 聯絡我們
- 物件搜尋頁面（縣市、類型、建物、租金區間、關鍵字）
- 物件詳情頁

### 後台 `/admin`
- 預設帳密：`admin / dingli123`（首次登入後請至「帳號設定」修改）
- 物件 CRUD（依參考圖片完整還原欄位：地址下拉、樓層、格局、坪數、設備、家具、租金、押金、特色標籤等）
- 圖片上傳一律自動轉 WebP，並存入 Cloudinary CDN（本機開發與部署皆同一條路徑）
- 首頁輪播圖管理（拖曳排序、調整秒數）
- 修改密碼

## 開發

```bash
# 1. 安裝依賴
npm install

# 2. 啟動 PostgreSQL（Railway 或本機）並設定 .env
cp .env.example .env
# 編輯 DATABASE_URL

# 3. 同步 schema 到 DB
npx prisma db push

# 4. 建立預設管理員
npm run db:seed

# 5. 啟動
npm run dev
# → http://localhost:3000
# → http://localhost:3000/admin/login
```

## 部署到 Railway

1. 建立 PostgreSQL 服務 → 取得 `DATABASE_URL`
2. 至 [cloudinary.com](https://cloudinary.com) 建立 account（免費方案 25GB 儲存 / 25GB 流量）→ Dashboard 取得 **API Environment variable**
3. 建立 Web 服務，連接此 GitHub Repo（[github.com/lovemage/dingli-rental](https://github.com/lovemage/dingli-rental)）
4. 環境變數設定：
   ```
   DATABASE_URL=<Railway 注入>
   JWT_SECRET=<請改為長隨機字串>
   NEXT_PUBLIC_SITE_URL=https://dingli-rental.com
   CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>
   OPENROUTER_API_KEY=<選填；後台 AI 設定可覆蓋>
   ```
5. 自訂網域指向 `dingli-rental.com`

> Cloudinary 上傳的圖片預設公開可讀，無需額外設定 bucket policy 或 ACL。

部署指令會自動：`npm install` → `prisma generate` → `next build`，啟動則執行 `next start`。

首次部署後，於 Railway shell 執行：
```bash
npx prisma db push
npm run db:seed
```

## 資料庫結構修改

如需新增欄位 / 表格：
1. 編輯 `prisma/schema.prisma`
2. 執行 `npx prisma db push`（開發）或 `npx prisma migrate dev`（含 migration）
3. Prisma client 會自動重新生成

## 目錄結構

```
src/
├── app/
│   ├── (前台 routes)
│   ├── admin/
│   │   ├── login/             # 登入頁
│   │   └── (panel)/           # 已登入路由群組
│   │       ├── page.tsx       # 儀表板
│   │       ├── properties/    # 物件 CRUD
│   │       ├── hero/          # 輪播管理
│   │       └── settings/      # 帳號設定
│   ├── api/
│   │   ├── auth/              # 登入/登出/改密碼
│   │   ├── properties/        # 物件 API
│   │   ├── upload/            # 圖片上傳（自動 WebP）
│   │   └── hero/              # 輪播 API
│   └── layout.tsx
├── components/
│   ├── frontend/              # Header/Footer/Hero/...
│   └── admin/                 # AdminShell/PropertyForm/...
├── lib/
│   ├── prisma.ts
│   ├── auth.ts                # JWT cookie 認證
│   └── storage.ts             # WebP 轉檔 + Cloudinary 上傳
└── data/
    └── taiwan-addresses.ts    # 北北基桃竹 縣市/鄉鎮
```

## 安全提醒

- 部署前務必修改 `JWT_SECRET` 為長隨機字串
- 首次登入後請立即修改 admin 密碼
- 建議在 Railway 啟用 HTTPS 與自動憑證
