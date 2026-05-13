import { setRequestLocale } from 'next-intl/server';
import Header from '@/components/frontend/Header';
import Footer from '@/components/frontend/Footer';
import ContactForm from '@/components/frontend/ContactForm';
import { prisma } from '@/lib/prisma';
import { CONTACT_DEFAULTS, type ContactContent } from '@/data/contact-defaults';
import { translateCmsSection } from '@/lib/cms-translate';

export const dynamic = 'force-dynamic';

async function getContactContent(locale: string): Promise<ContactContent> {
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

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const c = await getContactContent(locale);
  return (
    <>
      <Header />
      <main className="py-16 sm:py-20">
        <div className="container-page">
          <div className="text-center mb-14">
            <span className="eyebrow">
              <span className="dot" />
              {c.eyebrow}
            </span>
            <h1 className="text-3xl sm:text-4xl font-black mt-3 mb-3 leading-tight">{c.title}</h1>
            <p className="text-ink-500 max-w-2xl mx-auto">{c.description}</p>
          </div>

          <div className="max-w-3xl mx-auto">
            <ContactForm
              title={c.formTitle}
              submitText={c.formSubmitText}
              note={c.formNote}
              successMessage={c.formSuccessMessage}
            />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
