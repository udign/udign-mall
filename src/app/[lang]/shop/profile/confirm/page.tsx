import { getDictionary } from '@/lib/dictionaries';
import { Locale } from '../../../../../../i18n.config';
import ProfileConfirmClient from '@/components/ProfileConfirmClient';

interface ProfileConfirmPageProps {
  params: Promise<{ lang: Locale }>;
}

export default async function ProfileConfirmPage({ params }: ProfileConfirmPageProps) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return <ProfileConfirmClient dictionary={dictionary} />;
}
