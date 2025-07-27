'use client';

import { useRouter } from 'next/navigation';
import RegisterForm from '@/components/RegisterForm';
import { ROUTES } from '@/lib/routes';

export default function RegisterPage() {
  const router = useRouter();

  const handleAuthSuccess = () => router.push(ROUTES.HOME);

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
          <RegisterForm
            onSuccess={handleAuthSuccess}
            onSwitchToLogin={() => router.push(ROUTES.LOGIN)}
          />
        </div>
      </div>
    </div>
  );
}
