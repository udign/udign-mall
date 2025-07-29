import { getDictionary } from '@/lib/dictionaries';
import { Locale } from '../../../../../i18n.config';
import RegisterPageClient from '@/components/RegisterPageClient';

interface RegisterPageProps {
  params: Promise<{ lang: Locale }>;
}

export default async function RegisterPage({ params }: RegisterPageProps) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return <RegisterPageClient dictionary={dictionary} />;
}
