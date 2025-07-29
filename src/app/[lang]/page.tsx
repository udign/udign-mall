import { redirect } from 'next/navigation';
import { Locale } from '../../../i18n.config';

interface RootPageProps {
  params: Promise<{ lang: Locale }>;
}

export default async function LangRootPage({ params }: RootPageProps) {
  const { lang } = await params;
  redirect(`/${lang}/shop`);
}
