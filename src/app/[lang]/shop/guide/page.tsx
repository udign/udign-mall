import { getDictionary } from '@/lib/dictionaries';
import { Locale } from '../../../../../i18n.config';

interface GuidePageProps {
  params: Promise<{ lang: Locale }>;
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return (
    <div className='min-h-screen bg-white'>
      <div className='px-6 py-8 sm:px-10'>
        <div className='mx-auto'>
          <h1 className='mb-8 text-center text-2xl font-bold text-gray-900'>
            {dictionary.guide.title}
          </h1>

          <div className='mb-6 rounded-lg border border-blue-200 bg-blue-50 p-6'>
            <p className='text-center text-gray-700'>
              {dictionary.guide.progressInfo.replace('MY UDIGN', '')}
              <span className='font-semibold text-red-500'>{dictionary.guide.myUdign}</span>
              {dictionary.guide.progressInfo.includes('에서 확인')
                ? ' 에서 확인하실 수 있습니다.'
                : '.'}
            </p>
          </div>

          <div className='mb-6 rounded-lg border border-gray-200 bg-gray-50 p-6'>
            <div className='flex flex-wrap items-center justify-center gap-4 text-sm text-gray-600'>
              <span className='font-semibold'>{dictionary.guide.steps.designLike}</span>
              <span>→</span>
              <span className='font-semibold'>{dictionary.guide.steps.productionReview}</span>
              <span>→</span>
              <span className='font-semibold'>{dictionary.guide.steps.purchaseProgress}</span>
              <span>→</span>
              <span className='font-semibold'>{dictionary.guide.steps.orderConfirmation}</span>
              <span>→</span>
              <span className='font-semibold'>{dictionary.guide.steps.productManufacturing}</span>
              <span>→</span>
              <span className='font-semibold'>{dictionary.guide.steps.deliveryProgress}</span>
              <span>→</span>
              <span className='font-semibold'>{dictionary.guide.steps.receiptComplete}</span>
            </div>
          </div>

          <div className='space-y-6'>
            <div className='rounded-lg border border-gray-200 p-6'>
              <h2 className='mb-4 text-lg font-semibold text-gray-900'>
                {dictionary.guide.sections.section1.title}
              </h2>
              <div className='space-y-3 text-gray-700'>
                <p>{dictionary.guide.sections.section1.content1}</p>
                <p>{dictionary.guide.sections.section1.content2}</p>
                <p className='text-sm text-gray-500'>{dictionary.guide.sections.section1.note}</p>
              </div>
            </div>

            <div className='rounded-lg border border-gray-200 p-6'>
              <h2 className='mb-4 text-lg font-semibold text-gray-900'>
                {dictionary.guide.sections.section2.title}
              </h2>
              <div className='space-y-3 text-gray-700'>
                <p>{dictionary.guide.sections.section2.content}</p>
              </div>
            </div>

            <div className='rounded-lg border border-gray-200 p-6'>
              <h2 className='mb-4 text-lg font-semibold text-gray-900'>
                {dictionary.guide.sections.section3.title}
              </h2>
              <div className='space-y-3 text-gray-700'>
                <p>{dictionary.guide.sections.section3.content1}</p>
                <p className='font-semibold'>{dictionary.guide.sections.section3.content2}</p>
              </div>
            </div>

            <div className='rounded-lg border border-gray-200 p-6'>
              <h2 className='mb-4 text-lg font-semibold text-gray-900'>
                {dictionary.guide.sections.section4.title}
              </h2>
              <div className='space-y-3 text-gray-700'>
                <p>{dictionary.guide.sections.section4.content1}</p>
                <p>{dictionary.guide.sections.section4.content2}</p>
                <p>{dictionary.guide.sections.section4.content3}</p>
              </div>
            </div>

            <div className='rounded-lg border border-gray-200 p-6'>
              <h2 className='mb-4 text-lg font-semibold text-gray-900'>
                {dictionary.guide.sections.section5.title}
              </h2>
              <div className='space-y-3 text-gray-700'>
                <p>{dictionary.guide.sections.section5.content}</p>
              </div>
            </div>

            <div className='rounded-lg border border-gray-200 p-6'>
              <h2 className='mb-4 text-lg font-semibold text-gray-900'>
                {dictionary.guide.sections.section6.title}
              </h2>
              <div className='space-y-3 text-gray-700'>
                <p>{dictionary.guide.sections.section6.content1}</p>
                <p>{dictionary.guide.sections.section6.content2}</p>
              </div>
            </div>

            <div className='rounded-lg border border-gray-200 p-6'>
              <h2 className='mb-4 text-lg font-semibold text-gray-900'>
                {dictionary.guide.sections.section7.title}
              </h2>
              <div className='space-y-3 text-gray-700'>
                <p>{dictionary.guide.sections.section7.content1}</p>
                <p>{dictionary.guide.sections.section7.content2}</p>
                <p>{dictionary.guide.sections.section7.content3}</p>
                <p className='font-semibold'>{dictionary.guide.sections.section7.content4}</p>
                <div className='ml-4 space-y-1 text-gray-600'>
                  <p>• {dictionary.guide.sections.section7.notes.note1}</p>
                  <p>• {dictionary.guide.sections.section7.notes.note2}</p>
                  <p>• {dictionary.guide.sections.section7.notes.note3}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
