import { Suspense } from 'react';
import LoadingState from '@/components/states/LoadingState';
import PaymentSuccessContent from '@/components/PaymentSuccessContent';
import { getDictionary } from '@/lib/dictionaries';
import { Locale } from '../../../../../../i18n.config';

interface PaymentSuccessPageProps {
  params: Promise<{ lang: Locale }>;
}

export default async function PaymentSuccessPage({ params }: PaymentSuccessPageProps) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return (
    <Suspense
      fallback={
        <LoadingState
          message={dictionary.paymentSuccess.processingResult}
          dictionary={dictionary}
        />
      }
    >
      <PaymentSuccessContent dictionary={dictionary} />
    </Suspense>
  );
}
