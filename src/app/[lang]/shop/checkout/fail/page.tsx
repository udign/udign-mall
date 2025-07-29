import { Suspense } from 'react';
import LoadingState from '@/components/states/LoadingState';
import PaymentFailContent from '@/components/PaymentFailContent';
import { getDictionary } from '@/lib/dictionaries';
import { Locale } from '../../../../../../i18n.config';

interface PaymentFailPageProps {
  params: Promise<{ lang: Locale }>;
}

export default async function PaymentFailPage({ params }: PaymentFailPageProps) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return (
    <Suspense
      fallback={
        <LoadingState message={dictionary.paymentFail.checkingResult} dictionary={dictionary} />
      }
    >
      <PaymentFailContent dictionary={dictionary} />
    </Suspense>
  );
}
