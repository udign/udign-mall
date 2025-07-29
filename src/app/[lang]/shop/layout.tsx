import { ReactNode } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PopupDisplay from '@/components/PopupDisplay';
import { Locale } from '../../../../i18n.config';
import { getDictionary } from '@/lib/dictionaries';

interface UserLayoutProps {
  children: ReactNode;
  params: Promise<{ lang: Locale }>;
}

export default async function UserLayout({ children, params }: UserLayoutProps) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return (
    <>
      <Header dictionary={dictionary} />
      {children}
      <Footer dictionary={dictionary} />
      <PopupDisplay />
    </>
  );
}
