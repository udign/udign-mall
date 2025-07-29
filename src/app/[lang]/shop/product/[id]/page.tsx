import ProductDetailClient from '@/components/ProductDetailClient';
import { getDictionary } from '@/lib/dictionaries';
import { Locale } from '../../../../../../i18n.config';

interface ProductDetailPageProps {
  params: Promise<{ lang: Locale; id: string }>;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return <ProductDetailClient dictionary={dictionary} />;
}
