import { getDictionary } from '@/lib/dictionaries';
import { Locale } from '../../../../../i18n.config';
import UploadPageClient from '@/components/UploadPageClient';

interface UploadPageProps {
  params: Promise<{ lang: Locale }>;
}

export default async function UploadPage({ params }: UploadPageProps) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return <UploadPageClient dictionary={dictionary} />;
}
