import { getDictionary } from '@/lib/dictionaries';
import { Locale } from '../../../../../i18n.config';
import ForgotPasswordForm from '@/components/ForgotPasswordForm';

interface ForgotPasswordPageProps {
  params: Promise<{ lang: Locale }>;
}

export default async function ForgotPasswordPage({ params }: ForgotPasswordPageProps) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return (
    <div
      className='flex min-h-screen flex-col bg-cover bg-fixed bg-center bg-no-repeat'
      style={{
        backgroundImage: 'url(/images/auth-bg.png)',
        backgroundColor: '#1a2332',
      }}
    >
      <div className='relative z-10 mt-10 flex flex-1 justify-center p-4'>
        <div className='w-full max-w-lg'>
          <ForgotPasswordForm dictionary={dictionary} />
        </div>
      </div>
    </div>
  );
}
