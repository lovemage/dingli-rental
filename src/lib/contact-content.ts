import { prisma } from '@/lib/prisma';
import { CONTACT_DEFAULTS, type ContactContent } from '@/data/contact-defaults';
import { translateCmsSection } from '@/lib/cms-translate';

/**
 * 讀取後台可編輯的聯絡頁內容（SiteContent.section = 'contact_page'）。
 * /contact 與 /thank-you 共用，兩頁的文案才不會各自維護一份。
 */
export async function getContactContent(locale: string): Promise<ContactContent> {
  try {
    const row = await prisma.siteContent.findUnique({ where: { section: 'contact_page' } });
    const data = (row?.data as Partial<ContactContent>) || {};
    const merged: ContactContent = {
      ...CONTACT_DEFAULTS,
      ...data,
      agents:
        Array.isArray(data.agents) && data.agents.length
          ? data.agents
          : CONTACT_DEFAULTS.agents,
      companyInfo: { ...CONTACT_DEFAULTS.companyInfo, ...(data.companyInfo || {}) },
    };
    if (locale === 'zh') return merged;
    const translated = await translateCmsSection(
      'contact_page',
      merged as unknown as Record<string, unknown>,
      locale
    );
    return { ...merged, ...(translated as Partial<ContactContent>) } as ContactContent;
  } catch {
    return CONTACT_DEFAULTS;
  }
}
