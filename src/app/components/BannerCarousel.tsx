'use client';

import { useState, useEffect } from 'react';
import { HiOutlinePlus } from 'react-icons/hi';

export default function BannerCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const banners = [
    {
      title: '내 디자인을 업로드하세요',
      subtitle: '나만의 특별한 작품을 만들어보세요',
      buttonText: '내 디자인 업로드하기',
      buttonLink: '/upload',
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length]);

  return (
    <div className='md:h-banner relative h-screen min-h-96 overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900'>
      <div className='max-w-container mx-auto h-full rounded-xl'>
        <div className='relative h-full bg-gradient-to-br from-gray-800 to-gray-900'>
          <div className='absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 transform px-4 text-center text-white'>
            <h2 className='mb-4 text-3xl leading-tight font-bold md:text-5xl'>
              {banners[currentSlide].title}
            </h2>
            <p className='mb-8 text-lg opacity-90 md:text-2xl'>{banners[currentSlide].subtitle}</p>

            <div className='pt-10'>
              <a
                href={banners[currentSlide].buttonLink}
                className='bg-primary hover:bg-primary-hover mx-auto inline-flex w-80 items-center justify-center gap-3 rounded-full py-3 text-lg font-medium text-white shadow-lg transition-all duration-300 hover:shadow-xl md:w-96 md:text-2xl'
              >
                <HiOutlinePlus className='text-lg text-white md:text-2xl' />
                {banners[currentSlide].buttonText}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
