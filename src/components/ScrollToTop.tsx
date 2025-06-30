'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/primitives/button';

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <Button
      onClick={scrollToTop}
      className={`fixed right-8 bottom-8 z-50 h-12 w-12 bg-[#1f2428] text-white shadow-lg transition-all duration-300 hover:bg-[#2d3339] ${
        isVisible ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      }`}
      size='icon'
      aria-label='맨 위로 이동'
    >
      <svg
        className='h-6 w-6'
        fill='none'
        stroke='currentColor'
        viewBox='0 0 24 24'
        xmlns='http://www.w3.org/2000/svg'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={2}
          d='M5 10l7-7m0 0l7 7m-7-7v18'
        />
      </svg>
    </Button>
  );
}
