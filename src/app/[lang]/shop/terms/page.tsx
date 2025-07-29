import { getDictionary } from '@/lib/dictionaries';
import { Locale } from '../../../../../i18n.config';
import TermsPageClient from '@/components/TermsPageClient';

interface TermsPageProps {
  params: Promise<{ lang: Locale }>;
}

export default async function TermsPage({ params }: TermsPageProps) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return <TermsPageClient dictionary={dictionary} />;
}
