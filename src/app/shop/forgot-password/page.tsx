'use client';

import Image from 'next/image';
import Link from 'next/link';
import ForgotPasswordForm from '@/components/ForgotPasswordForm';
import { ROUTES } from '@/lib/routes';

export default function ForgotPasswordPage() {
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
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}
