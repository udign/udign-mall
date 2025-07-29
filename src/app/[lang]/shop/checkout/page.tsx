import { Suspense } from 'react';
import LoadingState from '@/components/states/LoadingState';
import CheckoutContent from '@/components/CheckoutContent';
import { getDictionary } from '@/lib/dictionaries';
import { Locale } from '../../../../../i18n.config';

interface CheckoutPageProps {
  params: Promise<{ lang: Locale }>;
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return (
    <Suspense
      fallback={
        <LoadingState message={dictionary.checkout.preparingPage} dictionary={dictionary} />
      }
    >
      <CheckoutContent dictionary={dictionary} />
    </Suspense>
  );
}
