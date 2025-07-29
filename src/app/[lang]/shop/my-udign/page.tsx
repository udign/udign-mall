import { getDictionary } from '@/lib/dictionaries';
import { Locale } from '../../../../../i18n.config';
import MyUdignClient from '@/components/MyUdignClient';

interface MyUdignPageProps {
  params: Promise<{ lang: Locale }>;
}

export default async function MyUdignPage({ params }: MyUdignPageProps) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return <MyUdignClient dictionary={dictionary} />;
}
