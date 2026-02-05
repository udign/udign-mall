import { ReactNode } from 'react';
import FloatingUploadButton from '@/components/FloatingUploadButton';
import { getDictionary } from '@/lib/dictionaries';

interface CategoryLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    lang: "ko" | "en" | "ja" | "zh";
  }>;
}

export default async function CategoryLayout({ children, params }: CategoryLayoutProps) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return (
    <>
      <div className='mb-3 px-6 py-5 sm:px-10'>
        <div className='mb-8 aspect-video overflow-hidden rounded-xl'>
          <video
            src='/videos/fashion-banner-pc.mp4'
            className='h-auto w-full object-cover'
            autoPlay
            muted
            loop
            playsInline
          />
        </div>
        {children}
      </div>
      <FloatingUploadButton dictionary={dictionary} />
    </>
  );
}
