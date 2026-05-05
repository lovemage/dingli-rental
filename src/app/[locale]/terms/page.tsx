import LegalDocument from '@/components/frontend/LegalDocument';
import { LEGAL_LAST_UPDATED } from '@/data/legal-content';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'termsPage' });
  return { title: t('metaTitle') };
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('termsPage');

  return (
    <LegalDocument title={t('title')} lastUpdated={LEGAL_LAST_UPDATED}>
      <h2>1. 條款接受與適用</h2>
      <p>
        「鼎立租售管理」（網址：<code>dingli-rental.com</code>，以下簡稱「本網站」）由
        <strong>鼎立房屋有限公司</strong>（統一編號 93790198）營運。當您使用本網站任何功能時，
        即視為已閱讀、瞭解並同意接受本服務條款全部內容。
      </p>
      <p>
        本公司有權於任何時間修改或變更本條款，建議您隨時注意該等修改。修改後您繼續使用本網站，
        視為您已同意接受該等修改。如不同意修改後內容，請立即停止使用。
      </p>

      <h2>2. 服務內容</h2>
      <p>本網站提供下列服務：</p>
      <ul>
        <li>北北基桃竹（台北市、新北市、基隆市、桃園市、新竹市、新竹縣）之租賃與銷售物件刊登、查詢、媒合</li>
        <li>整層住家、獨立套房、分租套房、雅房、車位、辦公空間、店面等物件類型</li>
        <li>業務團隊到場帶看、合約議價、修繕協助等加值服務</li>
        <li>AI 客服協助初步諮詢與物件推薦</li>
        <li>聯絡表單、LINE 即時諮詢等多元聯繫管道</li>
      </ul>

      <h2>3. 物件資訊與隱私保護</h2>
      <p>
        所有物件圖片、規格、租金、地址、樓層等資訊，皆由本公司業務團隊實地確認後刊登。
        本公司盡力維持資訊準確，但物件狀況、租金及屋主條件可能隨時變動，
        最終以業務專員實地帶看與書面租賃契約為準。
      </p>
      <p>
        為保護物件隱私（避免同行未經授權之開發行為），物件詳情頁地圖僅顯示街區範圍，
        非精準門牌位置；隱藏門號之物件，前台僅顯示至街道層級。詳細地址請於業務專員陪同時取得。
      </p>

      <h2>4. AI 客服與 AI 物件辨識說明</h2>
      <p>
        本網站提供下列 AI 輔助功能：
      </p>
      <ul>
        <li><strong>AI 客服（鼎立 AI）</strong>：可基於即時物件資料庫提供物件推薦與一般諮詢</li>
        <li><strong>AI 物件辨識（OCR 上架系統）</strong>：協助業務從照片快速建立物件資料</li>
      </ul>
      <p>
        AI 回覆之內容僅供參考，<strong>不構成法律意見、租約承諾或合約建議</strong>。
        任何涉及租約簽訂、租金議價、看房預約、合約細節等具拘束力之事項，
        請務必透過 LINE 連結或客服信箱聯繫業務專員確認。
      </p>

      <h2>5. 您的義務與承諾</h2>
      <p>您承諾不利用本網站從事侵害他人權益或違法之行為，包含但不限於：</p>
      <ul>
        <li>冒用他人名義使用本網站服務</li>
        <li>上傳含病毒、惡意程式或破壞性程式碼之檔案</li>
        <li>以自動化工具大量擷取本網站內容（含物件清單、圖片）</li>
        <li>對本網站或其伺服器進行干擾、破解、滲透等行為</li>
        <li>利用聯絡表單或 AI 客服發送垃圾訊息、廣告或詐騙內容</li>
        <li>洩漏業務專員提供之非公開物件資訊予第三方競爭對手</li>
      </ul>

      <h2>6. 智慧財產權</h2>
      <p>
        本網站全部內容，包括但不限於物件文字描述、實地拍攝照片、版面設計、商標、Logo、
        程式碼、資料庫架構等，均屬本公司或原作者所有，受著作權法、商標法及公平交易法保護。
      </p>
      <p>
        未經本公司事前書面同意，不得擅自重製、改作、散布、公開傳輸或商業使用本網站任何內容。
      </p>

      <h2>7. 第三方連結與服務</h2>
      <p>
        本網站可能包含或使用以下第三方服務之連結與功能：
      </p>
      <ul>
        <li><strong>LINE</strong>：客服諮詢與業務聯繫</li>
        <li><strong>Google Maps</strong>：物件大略位置嵌入</li>
        <li><strong>Cloudinary</strong>：圖片儲存與 CDN</li>
        <li><strong>OpenRouter</strong>：AI 模型 gateway</li>
      </ul>
      <p>
        各第三方服務之內容與政策由其自行負責，本公司對其合適性、即時性、正確性不擔保。
        詳細個資處理方式請參閱本網站
        <a href="/privacy">隱私權政策</a>。
      </p>

      <h2>8. 服務變更、暫停與中斷</h2>
      <p>
        本公司有權視業務需要修改、暫停或終止本網站全部或部分服務，無須個別通知。
        因系統維護、伺服器故障、網路中斷、第三方服務不穩、不可抗力（如天災、戰爭、罷工）
        等因素導致服務中斷者，本公司不負損害賠償責任。
      </p>

      <h2>9. 兒童與青少年保護</h2>
      <p>
        未滿 18 歲之未成年人使用本網站，請於家長或監護人同意下進行。
        涉及租約簽訂、付款或其他法律行為，請由具完全行為能力之成年人負責。
      </p>

      <h2>10. 個人資料保護</h2>
      <p>
        您透過聯絡表單、AI 客服等管道提供之個人資料，本公司依「個人資料保護法」
        及本網站<a href="/privacy">隱私權政策</a>處理。
        您同意本公司於提供服務之必要範圍內蒐集、處理及利用您的個人資料。
      </p>

      <h2>11. 免責聲明</h2>
      <p>
        本網站之物件資訊、AI 建議、業務媒合等服務均屬「現狀」提供，
        本公司於下列情形不負損害賠償責任：
      </p>
      <ul>
        <li>因系統錯誤、網路問題導致之資料遺失或顯示錯誤</li>
        <li>第三方服務（如 LINE、Google Maps、Cloudinary）之故障或內容變動</li>
        <li>您因依本網站資訊作成決定（如租屋、退租、議價）所生之損害</li>
        <li>您未經業務專員確認即與屋主直接接洽所生之爭議</li>
        <li>因 AI 客服回覆內容而產生之誤解或損失</li>
      </ul>

      <h2>12. 補償</h2>
      <p>
        因您違反本服務條款、侵害他人權益、或濫用本網站服務所衍生第三人請求或主張時，
        您同意使本公司及其關係企業、員工、業務代理人免於任何損害。
      </p>

      <h2>13. 不得為商業利用</h2>
      <p>
        除事前取得本公司書面同意外，您不得對本網站任何部分（包括物件清單、圖片、
        AI 客服對話內容、會員資料等）進行重製、出售、轉售或作任何商業目的之使用。
      </p>

      <h2>14. 終止</h2>
      <p>
        若您違反本服務條款，本公司得不經通知立即終止您使用本網站之權利、刪除您所提供之
        相關資料。本公司亦得依其考量，於通知或未通知之情形下隨時終止或限制本網站之提供。
      </p>

      <h2>15. 準據法與管轄法院</h2>
      <p>
        本服務條款之解釋與適用，以及與本條款有關之爭議，依中華民國法律處理，
        並以<strong>台灣新北地方法院</strong>為第一審管轄法院。
      </p>

      <h2>16. 聯絡方式</h2>
      <div className="legal-info-card">
        <p><strong>公司名稱：</strong>鼎立房屋有限公司</p>
        <p><strong>統一編號：</strong>93790198</p>
        <p><strong>公司地址：</strong>新北市新莊區西盛街199號2樓</p>
        <p><strong>客服信箱：</strong><a href="mailto:service@dingli-rental.com">service@dingli-rental.com</a></p>
        <p><strong>服務時間：</strong>週一至週日 09:00 - 21:00</p>
        <p><strong>服務範圍：</strong>北北基桃竹</p>
      </div>
    </LegalDocument>
  );
}
