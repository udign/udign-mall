'use client';

import { ReactNode } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PopupDisplay from '@/components/PopupDisplay';
import { I18nProvider } from '@/contexts/I18nContext';
import '@/lib/i18n';

interface UserLayoutProps {
  children: ReactNode;
}

export default function UserLayout({ children }: UserLayoutProps) {
  return (
    <I18nProvider>
      <Header />
      {children}
      <Footer />
      <PopupDisplay />
    </I18nProvider>
  );
}
