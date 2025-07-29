import { getDictionary } from '@/lib/dictionaries';
import { Locale } from '../../../../../i18n.config';
import SearchClient from '@/components/SearchClient';

interface SearchPageProps {
  params: Promise<{ lang: Locale }>;
}

export default async function SearchPage({ params }: SearchPageProps) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return <SearchClient dictionary={dictionary} />;
}
