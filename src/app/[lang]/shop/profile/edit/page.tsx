import { getDictionary } from '@/lib/dictionaries';
import { Locale } from '../../../../../../i18n.config';
import ProfileEditClient from '@/components/ProfileEditClient';

interface ProfileEditPageProps {
  params: Promise<{ lang: Locale }>;
}

export default async function ProfileEditPage({ params }: ProfileEditPageProps) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return <ProfileEditClient dictionary={dictionary} />;
}
