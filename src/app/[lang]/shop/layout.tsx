import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PopupDisplay from '@/components/PopupDisplay';
import { getDictionary } from '@/lib/dictionaries';
type Locale = "en" | "ja" | "ko" | "zh";

interface CategoryLayoutProps {
  children: React.ReactNode;
  params: Promise<{ lang: string }>; 
}

export default async function CategoryLayout({ children, params }: CategoryLayoutProps) {
  // params를 await로 받아옵니다.
  const { lang } = await params;
  const dictionary = await getDictionary(lang as Locale);

  return (
    <>
      <Header dictionary={dictionary} />
      {children}
      <Footer dictionary={dictionary} />
      <PopupDisplay />
    </>
  );
}
