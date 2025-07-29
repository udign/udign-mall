import { getDictionary } from '@/lib/dictionaries';
import { Locale } from '../../../../../i18n.config';
import ResetPasswordClient from '@/components/ResetPasswordClient';

interface ResetPasswordPageProps {
  params: Promise<{ lang: Locale }>;
}

export default async function ResetPasswordPage({ params }: ResetPasswordPageProps) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return <ResetPasswordClient dictionary={dictionary} />;
}
