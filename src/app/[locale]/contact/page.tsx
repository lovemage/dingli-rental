import { getTranslations, setRequestLocale } from 'next-intl/server';
import Header from '@/components/frontend/Header';
import Footer from '@/components/frontend/Footer';
import ContactForm from '@/components/frontend/ContactForm';
import MaterialIcon from '@/components/MaterialIcon';
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

const BADGE_GRADIENT: Record<'green' | 'orange', string> = {
  green: 'from-brand-green-700 to-brand-green-900',
  orange: 'from-brand-orange-500 to-brand-orange-700',
};

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const c = await getContactContent(locale);
  const t = await getTranslations('contact');

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

          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-10 max-w-5xl mx-auto">
            <div className="space-y-5">
              <h2 className="text-xl font-black mb-2">{c.agentsTitle}</h2>

              {c.agents.map((agent, i) => (
                <div
                  key={`${agent.name}-${i}`}
                  className="bg-white rounded-xl border border-line p-6 shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    {agent.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={agent.avatarUrl}
                        alt={agent.name}
                        className="w-20 h-20 rounded-2xl object-cover border border-line"
                      />
                    ) : (
                      <div
                        className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${
                          BADGE_GRADIENT[agent.badgeColor] || BADGE_GRADIENT.green
                        } grid place-items-center text-3xl font-black text-white flex-shrink-0`}
                      >
                        {agent.initial}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-extrabold">{agent.name}</h3>
                      <p className="text-sm text-brand-orange-700 font-bold mb-3">{agent.role}</p>
                      {agent.bullets.length > 0 && (
                        <ul className="text-sm text-ink-700 space-y-1 mb-4 list-none p-0 m-0">
                          {agent.bullets.map((b, bi) => (
                            <li key={bi} className="flex items-start gap-1.5">
                              <MaterialIcon
                                name="check"
                                className="!text-base text-brand-green-700 mt-0.5 flex-shrink-0"
                              />
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {agent.phone && (
                          <a
                            href={`tel:${agent.phoneTel || agent.phone.replace(/[^\d+]/g, '')}`}
                            className="inline-flex items-center gap-1 bg-brand-green-700 text-white text-xs font-bold px-3 py-1.5 rounded-full"
                          >
                            <MaterialIcon name="call" className="!text-sm" />
                            {agent.phone}
                          </a>
                        )}
                        {agent.lineUrl && (
                          <a
                            href={agent.lineUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 bg-brand-orange-50 text-brand-orange-700 border border-brand-orange-300 text-xs font-bold px-3 py-1.5 rounded-full"
                          >
                            <MaterialIcon name="chat" className="!text-sm" />
                            LINE
                          </a>
                        )}
                        {agent.email && (
                          <a
                            href={`mailto:${agent.email}`}
                            className="inline-flex items-center gap-1 bg-paper-2 text-ink-700 border border-line text-xs font-bold px-3 py-1.5 rounded-full"
                          >
                            <MaterialIcon name="mail" className="!text-sm" />
                            Email
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="bg-paper-2 rounded-xl p-5 text-sm text-ink-700 space-y-1">
                <h4 className="font-bold mb-2">{c.companyInfoTitle}</h4>
                {c.companyInfo.companyName && (
                  <p>
                    {t('companyNameLabel')}
                    {c.companyInfo.companyName}
                  </p>
                )}
                {c.companyInfo.businessId && (
                  <p>
                    {t('businessIdLabel')}
                    {c.companyInfo.businessId}
                  </p>
                )}
                {c.companyInfo.address && (
                  <p>
                    {t('addressLabel')}
                    {c.companyInfo.address}
                  </p>
                )}
                {c.companyInfo.customerEmail && (
                  <p>
                    {t('customerEmailLabel')}
                    <a
                      href={`mailto:${c.companyInfo.customerEmail}`}
                      className="text-brand-green-700 hover:underline"
                    >
                      {c.companyInfo.customerEmail}
                    </a>
                  </p>
                )}
                {c.companyInfo.serviceHours && (
                  <p>
                    {t('serviceHoursLabel')}
                    {c.companyInfo.serviceHours}
                  </p>
                )}
                {c.companyInfo.serviceArea && (
                  <p>
                    {t('serviceAreaLabel')}
                    {c.companyInfo.serviceArea}
                  </p>
                )}
              </div>
            </div>

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
