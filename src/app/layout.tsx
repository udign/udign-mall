import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

import Header from '@/app/components/Header';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '유다인',
  description: '오직 당신만을 위한 디자인을 선택하세요. 최고의 선물이 완성됩니다.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='ko'>
      <body className={`${inter.className} mx-auto max-w-[1840px]`}>
        <Header />
        {children}
      </body>
    </html>
  );
}
