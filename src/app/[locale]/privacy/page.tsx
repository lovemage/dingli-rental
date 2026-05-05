import LegalDocument from '@/components/frontend/LegalDocument';
import { LEGAL_LAST_UPDATED } from '@/data/legal-content';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'privacyPage' });
  return { title: t('metaTitle') };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('privacyPage');

  return (
    <LegalDocument title={t('title')} lastUpdated={LEGAL_LAST_UPDATED}>
      <p>
        歡迎您造訪鼎立租售管理（<code>dingli-rental.com</code>）。為了讓您能安心使用本網站
        各項服務，特此向您說明本公司隱私權保護政策，請您詳閱下列內容：
      </p>

      <h2>1. 適用範圍</h2>
      <p>
        本政策適用於<strong>鼎立房屋有限公司</strong>營運之 <code>dingli-rental.com</code> 網站
        及相關服務（下稱「本網站」），<strong>不包含</strong>本網站連結之第三方網站
        （如 LINE、Google Maps、Cloudinary 等）。
      </p>

      <h2>2. 我們蒐集的資料類型</h2>
      <p>當您使用本網站時，本公司可能蒐集以下個人資料：</p>
      <ul>
        <li>
          <strong>聯絡表單填寫</strong>：姓名、聯絡電話、Email、希望地區、物件類型、預算、需求描述
        </li>
        <li>
          <strong>AI 客服對話</strong>：您與「鼎立 AI」客服之對話內容（用於即時回應，不長期保留歷史）
        </li>
        <li>
          <strong>系統自動記錄</strong>：IP 位址、地理位置概略資訊、瀏覽器類型、作業系統、
          造訪時間、瀏覽頁面路徑、裝置類型、語言設定
        </li>
        <li>
          <strong>Cookie</strong>：用於使用者體驗最佳化、登入狀態維持、流量分析
        </li>
      </ul>

      <h2>3. 個人資料利用目的</h2>
      <p>本公司蒐集您的個人資料，僅用於以下特定目的：</p>
      <ul>
        <li>媒合適合的物件、安排業務專員與您聯繫並回覆需求</li>
        <li>進行租賃、銷售、相關周邊服務之經紀代理</li>
        <li>客戶關係維繫與後續服務</li>
        <li>改善網站服務品質、最佳化使用者體驗</li>
        <li>統計分析（資料經去識別化處理）</li>
        <li>因應法律或主管機關要求之配合</li>
      </ul>
      <p>
        非經您書面同意，本公司不會將您的個人資料用於上述目的之外用途。
      </p>

      <h2>4. 您的權利</h2>
      <p>依《個人資料保護法》第 3 條，您可向本公司請求行使下列權利：</p>
      <ul>
        <li>查詢、閱覽您所提供之個人資料</li>
        <li>製給複製本</li>
        <li>請求補充或更正資料</li>
        <li>請求停止蒐集、處理或利用</li>
        <li>請求刪除個人資料</li>
      </ul>
      <p>
        請來信 <a href="mailto:service@dingli-rental.com">service@dingli-rental.com</a> 提出申請。
        惟您應理解，刪除或停止蒐集後，部分服務（如物件媒合、AI 客服等）可能無法繼續提供。
      </p>

      <h2>5. 資料保護措施</h2>
      <p>本公司採取下列安全措施保護您的個人資料：</p>
      <ul>
        <li><strong>傳輸加密</strong>：全站採用 HTTPS 加密通訊</li>
        <li><strong>後台存取控管</strong>：管理員需通過帳號密碼驗證才能存取資料</li>
        <li><strong>API 認證</strong>：管理 API 需通過 JWT cookie 認證</li>
        <li><strong>敏感資訊加密</strong>：API key、token 等敏感資訊以遮罩方式儲存與顯示</li>
        <li><strong>第三方服務隔離</strong>：API key 僅後端使用，不會傳送到前台</li>
        <li>請您妥善保管個人裝置與帳號密碼，使用完畢後請關閉瀏覽器視窗</li>
      </ul>

      <h2>6. 第三方資料分享</h2>
      <p>
        本公司絕不會出售、出租、交換或贈與您的個人資料予任何個人、團體、私人企業或公務機關。
        但下列情形除外：
      </p>
      <ul>
        <li>取得您事前書面同意</li>
        <li>法律明文規定</li>
        <li>為免除您生命、身體、自由或財產上之急迫危險</li>
        <li>與公務機關或學術研究機構合作，基於公共利益且資料經去識別化</li>
        <li>當您於本網站之行為違反服務條款或損害他人權益時，揭露為辨識、聯絡、採取法律行動所必要</li>
      </ul>

      <h2>7. 委外服務</h2>
      <p>
        為提供完整服務，本公司使用以下第三方服務，可能涉及您的資料傳輸或處理。
        本公司會嚴格要求委外廠商遵守保密義務：
      </p>
      <ul>
        <li>
          <strong>Cloudinary</strong>（圖片儲存與 CDN）：物件照片、頭像、Hero 圖等檔案
        </li>
        <li>
          <strong>OpenRouter</strong>（AI 模型 gateway）：AI 客服與物件辨識之文字／圖片
        </li>
        <li>
          <strong>Google Maps</strong>（地圖嵌入）：物件詳情頁之街區地圖
        </li>
        <li>
          <strong>Telegram Bot API</strong>（後台通知）：客戶詢問通知（不含一般使用者瀏覽資料）
        </li>
        <li>
          <strong>Railway</strong>（雲端代管）：網站主機與 PostgreSQL 資料庫
        </li>
      </ul>
      <p>
        各服務有其自身隱私政策，建議您另行查閱以瞭解詳細處理方式。
      </p>

      <h2>8. Cookie 使用說明</h2>
      <p>
        本網站使用必要 Cookie 維持後台管理員登入狀態與使用者偏好設定。
        您可透過瀏覽器設定關閉或限制 Cookie，但部分功能（如後台登入）可能無法正常運作。
      </p>

      <h2>9. AI 客服與資料處理</h2>
      <p>
        當您使用「鼎立 AI」客服功能時，您的對話內容會即時傳送至 OpenRouter 進行 AI 模型推論，
        並在回應後返回給您。本公司：
      </p>
      <ul>
        <li>不會主動長期保存您的完整對話歷史</li>
        <li>不會使用您的對話內容訓練模型</li>
        <li>會將即時可租物件清單（不含個資）作為 AI 推薦依據</li>
      </ul>
      <p>
        請避免在 AI 客服對話中輸入身分證字號、信用卡號等敏感資訊。
      </p>

      <h2>10. 物件位置隱私</h2>
      <p>
        為保護物件屋主與本公司商業利益，物件詳情頁之 Google Map 嵌入<strong>僅顯示街區範圍</strong>
        （區域 + 區 + 街道，不含巷弄號）。隱藏門號之物件再降一級為
        <strong>區域 + 區</strong>。詳細地址請於業務專員陪同帶看時取得。
      </p>

      <h2>11. 兒童與青少年保護</h2>
      <p>
        本網站不主動蒐集 13 歲以下兒童之個人資料。若家長或監護人發現未成年人未經同意提供
        個人資料予本公司，請立即來信通知，本公司將儘速刪除相關資料。
      </p>

      <h2>12. 政策修改</h2>
      <p>
        本公司保留隨時修改本隱私權政策之權利。修改後將於本網站公告，自公告日起生效。
        重大變更我們將以更顯著方式提醒您。建議您定期查閱本頁面最新內容。
      </p>

      <h2>13. 聯絡方式</h2>
      <p>如有隱私相關疑問或申請事項，請來信聯繫：</p>
      <div className="legal-info-card">
        <p><strong>公司名稱：</strong>鼎立房屋有限公司</p>
        <p><strong>統一編號：</strong>93790198</p>
        <p><strong>公司地址：</strong>新北市新莊區西盛街199號2樓</p>
        <p><strong>電子信箱：</strong><a href="mailto:service@dingli-rental.com">service@dingli-rental.com</a></p>
        <p><strong>服務時間：</strong>週一至週日 09:00 - 21:00</p>
      </div>
    </LegalDocument>
  );
}
