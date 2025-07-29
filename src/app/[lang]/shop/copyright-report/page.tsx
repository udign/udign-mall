import { Suspense } from 'react';
import LoadingState from '@/components/states/LoadingState';
import CopyrightReportContent from '@/components/CopyrightReportContent';
import { getDictionary } from '@/lib/dictionaries';
import { Locale } from '../../../../../i18n.config';

interface CopyrightReportPageProps {
  params: Promise<{ lang: Locale }>;
}

export default async function CopyrightReportPage({ params }: CopyrightReportPageProps) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return (
    <Suspense
      fallback={
        <LoadingState message={dictionary.copyrightReport.loadingMessage} dictionary={dictionary} />
      }
    >
      <CopyrightReportContent dictionary={dictionary} />
    </Suspense>
  );
}
