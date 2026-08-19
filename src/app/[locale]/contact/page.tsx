import { setRequestLocale } from 'next-intl/server';
import Header from '@/components/frontend/Header';
import Footer from '@/components/frontend/Footer';
import ContactForm from '@/components/frontend/ContactForm';
import { getContactContent } from '@/lib/contact-content';

export const dynamic = 'force-dynamic';

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
