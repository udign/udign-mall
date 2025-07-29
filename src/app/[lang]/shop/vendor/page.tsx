import { getDictionary } from '@/lib/dictionaries';
import { Locale } from '../../../../../i18n.config';
import VendorRegisterPageClient from '@/components/VendorRegisterForm';

interface VendorRegisterPageProps {
  params: Promise<{ lang: Locale }>;
}

export default async function VendorRegisterPage({ params }: VendorRegisterPageProps) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return <VendorRegisterPageClient dictionary={dictionary} />;
}
