import { getDictionary } from '@/lib/dictionaries';
import { Locale } from '../../../../i18n.config';
import ShopClient from '@/components/ShopClient';

interface ShopPageProps {
  params: Promise<{ lang: Locale }>;
}

export default async function ShopPage({ params }: ShopPageProps) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return <ShopClient dictionary={dictionary} />;
}
