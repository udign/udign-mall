'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';
import { termsOfService, privacyPolicy } from '@/lib/terms-content';

interface Agreements {
  all: boolean;
  terms: boolean;
  privacy: boolean;
}

export default function TermsPage() {
  const [agreements, setAgreements] = useState<Agreements>({
    all: false,
    terms: false,
    privacy: false,
  });

  const router = useRouter();

  const handleAllAgreement = (checked: boolean): void => {
    setAgreements({
      all: checked,
      terms: checked,
      privacy: checked,
    });
  };

  const handleIndividualAgreement = (
    key: keyof Pick<Agreements, 'terms' | 'privacy'>,
    checked: boolean,
  ): void => {
    const newAgreements: Agreements = {
      ...agreements,
      [key]: checked,
    };

    // 개별 항목이 모두 체크되면 전체 동의도 체크
    newAgreements.all = newAgreements.terms && newAgreements.privacy;

    setAgreements(newAgreements);
  };

  const handleSubmit = (): void => {
    if (agreements.terms && agreements.privacy) {
      router.push('/register');
    } else {
      alert('필수 약관에 동의해주세요.');
    }
  };

  const isSubmitEnabled: boolean = agreements.terms && agreements.privacy;

  return (
    <div
      className='flex min-h-screen flex-col bg-cover bg-fixed bg-center bg-no-repeat'
      style={{
        backgroundImage: 'url(/images/auth-bg.png)',
        backgroundColor: '#1a2332',
      }}
    >
      <div className='relative z-10'>
        <div className='px-6 py-5 sm:px-10'>
          <div className='flex items-center'>
            <Link href='/' className='flex items-center'>
              <Image
                src='/images/udign-white.png'
                alt='UDIGN'
                width={100}
                height={40}
                className='h-auto'
              />
            </Link>
          </div>
        </div>
      </div>

      <div className='relative z-10 mt-10 flex flex-1 justify-center p-4'>
        <div className='w-full max-w-2xl'>
          <div className='rounded-lg border border-gray-600 bg-black/80 p-8 backdrop-blur-sm'>
            <div className='mb-6'>
              <h2 className='mb-2 text-2xl font-semibold text-white'>이용약관</h2>
              <p className='text-base text-gray-300'>서비스 이용을 위해 약관에 동의해주세요.</p>
            </div>

            <div className='space-y-6'>
              <div className='rounded-lg border border-gray-600 p-4'>
                <div className='flex items-center space-x-3'>
                  <Switch checked={agreements.all} onCheckedChange={handleAllAgreement} />
                  <span className='text-lg font-semibold text-white'>이용약관 전체 동의</span>
                </div>
              </div>

              <div className='rounded-lg border border-gray-600 p-4'>
                <Accordion type='single' collapsible>
                  <AccordionItem value='terms' className='border-none'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center space-x-3'>
                        <Switch
                          checked={agreements.terms}
                          onCheckedChange={(checked) => handleIndividualAgreement('terms', checked)}
                        />
                        <span className='text-white'>(필수)회원가입약관 동의</span>
                      </div>
                      <AccordionTrigger className='cursor-pointer py-0 text-gray-300 hover:text-white hover:no-underline'>
                        전문
                      </AccordionTrigger>
                    </div>
                    <AccordionContent className='mt-4 max-h-60 overflow-y-auto text-sm leading-relaxed text-gray-300'>
                      <div className='whitespace-pre-line'>{termsOfService}</div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>

              <div className='rounded-lg border border-gray-600 p-4'>
                <Accordion type='single' collapsible>
                  <AccordionItem value='privacy' className='border-none'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center space-x-3'>
                        <Switch
                          checked={agreements.privacy}
                          onCheckedChange={(checked) =>
                            handleIndividualAgreement('privacy', checked)
                          }
                        />
                        <span className='text-white'>(필수)개인정보 처리방침 안내 동의</span>
                      </div>
                      <AccordionTrigger className='cursor-pointer py-0 text-gray-300 hover:text-white hover:no-underline'>
                        전문
                      </AccordionTrigger>
                    </div>
                    <AccordionContent className='mt-4 max-h-60 overflow-y-auto text-sm leading-relaxed text-gray-300'>
                      <div className='whitespace-pre-line'>{privacyPolicy}</div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>

            <div className='mt-8 flex space-x-4'>
              <button
                onClick={() => router.push('/')}
                className='flex-1 cursor-pointer rounded bg-gray-600 px-4 py-3 font-medium text-white transition-colors duration-200 hover:bg-gray-500'
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={!isSubmitEnabled}
                className={`flex-1 cursor-pointer rounded px-4 py-3 font-medium text-white transition-colors duration-200 ${
                  isSubmitEnabled
                    ? 'bg-primary hover:bg-primary-hover cursor-pointer'
                    : 'bg-gray-light cursor-not-allowed opacity-50'
                }`}
              >
                신규계정 생성
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
