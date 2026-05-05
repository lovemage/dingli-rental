import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'https://dingli-rental.com'
  ),
  title: {
    default: '鼎立租售管理 ｜ 為您找到最理想的家',
    template: '%s ｜ 鼎立租售管理',
  },
  description:
    '鼎立租售管理 Dingli Rental Service — 深耕北北基桃竹的專業租賃品牌，提供住宅、辦公、店面租售服務。中英日多語溝通、專人陪同帶看、透明合約收費。',
  openGraph: {
    type: 'website',
    locale: 'zh_TW',
    siteName: '鼎立租售管理',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-TW">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700;900&family=Plus+Jakarta+Sans:wght@500;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
