import Image from 'next/image';
import { getDictionary } from '@/lib/dictionaries';
import { Locale } from '../../../../../i18n.config';

interface CompanyPageProps {
  params: Promise<{ lang: Locale }>;
}

export default async function CompanyPage({ params }: CompanyPageProps) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return (
    <div className='min-h-screen bg-white'>
      <div className='px-6 py-8 sm:px-10'>
        <div className='mx-auto'>
          <h1 className='mb-8 text-center text-2xl font-bold text-gray-900'>
            {dictionary.company.title}
          </h1>

          <div className='mb-8 space-y-6'>
            <div className='relative overflow-hidden rounded-lg border border-gray-200'>
              <Image
                src='/images/comp_1.jpg'
                alt={dictionary.company.images.alt1}
                width={800}
                height={400}
                className='h-64 w-full object-cover'
              />
              <div className='bg-opacity-40 absolute inset-0 flex items-center justify-center'>
                <p className='px-6 text-center text-lg leading-normal font-medium text-white sm:text-2xl'>
                  {dictionary.company.mainMessage.split('\n').map((line, index) => (
                    <span key={index}>
                      {line}
                      {index < dictionary.company.mainMessage.split('\n').length - 1 && <br />}
                    </span>
                  ))}
                </p>
              </div>
            </div>
            <div className='overflow-hidden rounded-lg border border-gray-200'>
              <Image
                src='/images/comp_2.jpg'
                alt={dictionary.company.images.alt2}
                width={800}
                height={400}
                className='h-64 w-full object-cover'
              />
            </div>
          </div>

          <div className='mb-8 rounded-lg border border-gray-200 p-6'>
            <h2 className='mb-4 text-center text-lg font-semibold text-gray-900'>
              {dictionary.company.welcome.title}
            </h2>
            <div className='space-y-4 text-gray-700'>
              <p>{dictionary.company.welcome.paragraph1}</p>
              <p>{dictionary.company.welcome.paragraph2}</p>
              <p>{dictionary.company.welcome.paragraph3}</p>
              <p>{dictionary.company.welcome.paragraph4}</p>
              <p>{dictionary.company.welcome.paragraph5}</p>
              <p className='font-medium text-blue-700'>{dictionary.company.welcome.logoMessage}</p>
            </div>
          </div>

          <div className='mb-8 rounded-lg border border-gray-200 bg-blue-50 p-6'>
            <h2 className='mb-4 text-center text-xl font-bold text-gray-900'>
              {dictionary.company.visionMission.title}
            </h2>
            <div className='text-center'>
              <p className='mb-2 text-lg font-semibold text-blue-800'>
                {dictionary.company.visionMission.subtitle1}
              </p>
              <p className='mb-4 text-lg font-semibold text-blue-800'>
                {dictionary.company.visionMission.subtitle2}
              </p>
              <div className='grid grid-cols-1 gap-4 text-sm md:grid-cols-3'>
                <div className='rounded-lg bg-white p-4'>
                  <h3 className='mb-2 font-semibold text-gray-900'>
                    {dictionary.company.visionMission.sustainability.title}
                  </h3>
                  <p className='text-gray-600'>
                    {dictionary.company.visionMission.sustainability.description}
                  </p>
                </div>
                <div className='rounded-lg bg-white p-4'>
                  <h3 className='mb-2 font-semibold text-gray-900'>
                    {dictionary.company.visionMission.fairCompetition.title}
                  </h3>
                  <p className='text-gray-600'>
                    {dictionary.company.visionMission.fairCompetition.description}
                  </p>
                </div>
                <div className='rounded-lg bg-white p-4'>
                  <h3 className='mb-2 font-semibold text-gray-900'>
                    {dictionary.company.visionMission.transparency.title}
                  </h3>
                  <p className='text-gray-600'>
                    {dictionary.company.visionMission.transparency.description}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className='space-y-6'>
            <h2 className='text-xl font-bold text-gray-900'>
              {dictionary.company.coreValues.title}
            </h2>

            <div className='rounded-lg border border-gray-200 p-6'>
              <h3 className='mb-3 text-lg font-semibold text-gray-900'>
                {dictionary.company.coreValues.customerSatisfaction.title}
              </h3>
              <p className='leading-relaxed text-gray-700'>
                {dictionary.company.coreValues.customerSatisfaction.description}
              </p>
            </div>

            <div className='rounded-lg border border-gray-200 p-6'>
              <h3 className='mb-3 text-lg font-semibold text-gray-900'>
                {dictionary.company.coreValues.fairManagement.title}
              </h3>
              <p className='leading-relaxed text-gray-700'>
                {dictionary.company.coreValues.fairManagement.description}
              </p>
            </div>

            <div className='rounded-lg border border-gray-200 p-6'>
              <h3 className='mb-3 text-lg font-semibold text-gray-900'>
                {dictionary.company.coreValues.ecoFriendly.title}
              </h3>
              <p className='leading-relaxed text-gray-700'>
                {dictionary.company.coreValues.ecoFriendly.description}
              </p>
            </div>

            <div className='rounded-lg border border-gray-200 p-6'>
              <h3 className='mb-3 text-lg font-semibold text-gray-900'>
                {dictionary.company.coreValues.qualityManagement.title}
              </h3>
              <p className='leading-relaxed text-gray-700'>
                {dictionary.company.coreValues.qualityManagement.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
