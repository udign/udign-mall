import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PopupDisplay from '@/components/PopupDisplay';
import { getDictionary } from '@/lib/dictionaries';
import { Locale } from "../../../../i18n.config";

interface CategoryLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    lang: Locale;
  }>;
}

export default async function CategoryLayout({ children, params }: CategoryLayoutProps) {
  // params를 await로 받아옵니다.
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
