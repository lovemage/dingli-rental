import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-ink-900 text-white/75 pt-16 pb-8">
      <div className="container-page">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          <div>
            <Image src="/LOGO_0.png" alt="鼎立租售管理" width={200} height={40} className="h-12 w-auto mb-4 brightness-0 invert" />
            <p className="text-sm text-white/60 max-w-xs leading-relaxed">
              鼎立租售管理 Dingli Rental Service — 深耕北北基桃竹的專業租賃品牌，以誠信、透明、貼心為核心，陪您找到真正想回去的家。
            </p>
          </div>
          <div>
            <h5 className="text-white font-bold text-base mb-4">物件分類</h5>
            <ul className="space-y-2 text-sm text-white/65 list-none p-0 m-0">
              <li><Link href="/properties?type=整層住家" className="hover:text-brand-orange-300">整層住家</Link></li>
              <li><Link href="/properties?type=獨立套房" className="hover:text-brand-orange-300">獨立套房</Link></li>
              <li><Link href="/properties?type=分租套房" className="hover:text-brand-orange-300">分租套房</Link></li>
              <li><Link href="/properties" className="hover:text-brand-orange-300">所有物件</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="text-white font-bold text-base mb-4">關於鼎立</h5>
            <ul className="space-y-2 text-sm text-white/65 list-none p-0 m-0">
              <li><Link href="/services" className="hover:text-brand-orange-300">服務特色</Link></li>
              <li><Link href="/careers" className="hover:text-brand-orange-300">人才招募</Link></li>
              <li><Link href="/contact" className="hover:text-brand-orange-300">聯絡我們</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="text-white font-bold text-base mb-4">聯絡資訊</h5>
            <p className="text-sm text-white/65 mb-2">客服信箱<br />service@dingli-rental.com</p>
            <p className="text-sm text-white/65 mb-2">客服專線<br />0800-000-000</p>
            <p className="text-sm text-white/65">服務時間<br />週一至週日 09:00 - 21:00</p>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-wrap justify-between gap-3 text-xs text-white/50">
          <span>© 2026 鼎立租售管理 Dingli Rental Service. All rights reserved.</span>
          <span>隱私權政策・服務條款</span>
        </div>
      </div>
    </footer>
  );
}
