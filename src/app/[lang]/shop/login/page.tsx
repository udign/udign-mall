import { getDictionary } from '@/lib/dictionaries';
import { Locale } from '../../../../../i18n.config';
import LoginPageClient from '@/components/LoginPageClient';

interface LoginPageProps {
  params: Promise<{ lang: Locale }>;
}

export default async function LoginPage({ params }: LoginPageProps) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return <LoginPageClient dictionary={dictionary} />;
}
