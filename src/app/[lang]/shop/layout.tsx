import { } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PopupDisplay from '@/components/PopupDisplay';
import { Locale } from '../../../../i18n.config';
import { getDictionary } from '@/lib/dictionaries';

interface CategoryLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    lang: "ko" | "en" | "ja" | "zh";
  }>;
}

export default async function CategoryLayout({ children, params }: CategoryLayoutProps) {
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
