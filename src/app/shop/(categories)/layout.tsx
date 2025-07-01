'use client';

import { ReactNode } from 'react';

interface CategoryLayoutProps {
  children: ReactNode;
}

export default function CategoryLayout({ children }: CategoryLayoutProps) {
  return (
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
  );
}
