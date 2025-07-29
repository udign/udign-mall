'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/primitives/accordion';
import { Switch } from '@/components/ui/primitives/switch';
import { Button } from '@/components/ui/primitives/button';
import { termsOfService, privacyPolicy } from '@/lib/terms-content';
import { ROUTES } from '@/lib/routes';
import MessageDialog from '@/components/ui/MessageDialog';
import { Dictionary } from '@/lib/dictionaries';

interface Agreements {
  all: boolean;
  terms: boolean;
  privacy: boolean;
}

interface TermsPageClientProps {
  dictionary: Dictionary;
}

export default function TermsPageClient({ dictionary }: TermsPageClientProps) {
  const [agreements, setAgreements] = useState<Agreements>({
    all: false,
    terms: false,
    privacy: false,
  });
  const [showMessageDialog, setShowMessageDialog] = useState<boolean>(false);

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
      router.push(ROUTES.REGISTER);
    } else {
      setShowMessageDialog(true);
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
      <div className='relative z-10 mt-10 flex flex-1 justify-center p-4'>
        <div className='w-full max-w-2xl'>
          <div className='rounded-lg border border-gray-600 bg-black/80 p-8 backdrop-blur-sm'>
            <div className='mb-6'>
              <h2 className='mb-2 text-2xl font-semibold text-white'>
                {dictionary.auth.terms.title}
              </h2>
              <p className='text-base text-gray-300'>{dictionary.auth.terms.subtitle}</p>
            </div>

            <div className='space-y-6'>
              <div className='rounded-lg border border-gray-600 p-4'>
                <div className='flex items-center space-x-3'>
                  <Switch checked={agreements.all} onCheckedChange={handleAllAgreement} />
                  <span className='text-lg font-semibold text-white'>
                    {dictionary.auth.terms.allAgree}
                  </span>
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
                        <span className='text-white'>{dictionary.auth.terms.termsAgree}</span>
                      </div>
                      <AccordionTrigger className='cursor-pointer py-0 text-gray-300 hover:text-white hover:no-underline'>
                        {dictionary.auth.terms.viewFull}
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
                        <span className='text-white'>{dictionary.auth.terms.privacyAgree}</span>
                      </div>
                      <AccordionTrigger className='cursor-pointer py-0 text-gray-300 hover:text-white hover:no-underline'>
                        {dictionary.auth.terms.viewFull}
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
              <Button
                onClick={() => router.push(ROUTES.HOME)}
                variant='secondary'
                className='flex-1'
              >
                {dictionary.auth.terms.buttons.cancel}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!isSubmitEnabled}
                variant={isSubmitEnabled ? 'default' : 'secondary'}
                className='flex-1'
              >
                {dictionary.auth.terms.buttons.createAccount}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <MessageDialog
        open={showMessageDialog}
        onOpenChange={setShowMessageDialog}
        title={dictionary.auth.terms.dialog.title}
        description={dictionary.auth.terms.dialog.message}
        dictionary={dictionary}
      />
    </div>
  );
}
