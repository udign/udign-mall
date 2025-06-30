'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/Header';

interface LayoutContentProps {
  children: React.ReactNode;
}

export default function LayoutContent({ children }: LayoutContentProps) {
  const pathname = usePathname();
  const hideHeader = pathname === '/login' || pathname === '/register' || pathname === '/terms';

  return (
    <>
      {!hideHeader && <Header />}
      {children}
    </>
  );
}
