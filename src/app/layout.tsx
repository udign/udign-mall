import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '유다인',
  description: 'Udign Application',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='ko'>
      <body>{children}</body>
    </html>
  );
}
