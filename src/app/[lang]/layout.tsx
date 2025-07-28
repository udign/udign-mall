import ScrollToTop from '@/components/ScrollToTop';
import { AuthProvider } from '@/contexts/AuthContext';
import { i18n } from '../../../i18n.config';

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ lang: locale }));
}

export default async function LangLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className='flex min-h-screen justify-center'>
      <div className='container'>
        <AuthProvider>
          {children}
          <ScrollToTop />
        </AuthProvider>
      </div>
    </div>
  );
}
