import Link from 'next/link';
import Image from 'next/image';
import { FaPlus } from 'react-icons/fa';

export default function Home() {
  return (
    <main>
      <div className='relative mx-6 h-96 overflow-hidden rounded-xl sm:mx-10 sm:h-screen'>
        <video
          src='/videos/main-banner-pc.mp4'
          autoPlay
          loop
          muted
          className='hidden h-full w-full object-cover sm:block'
        />
        <video
          src='/videos/main-banner-mobile.mp4'
          autoPlay
          loop
          muted
          playsInline
          className='block h-full w-full object-cover sm:hidden'
        />
      </div>
      <section className='mx-auto px-6 py-14 sm:px-10 sm:py-20'>
        <div className='flex flex-col items-center gap-y-14 sm:gap-y-20'>
          <Link
            href='/upload'
            className='bg-primary hover:bg-primary-hover flex w-full max-w-xs items-center justify-center gap-2 rounded-2xl px-6 py-2.5 text-lg text-white transition-all duration-300 sm:max-w-md sm:gap-3 sm:rounded-3xl sm:px-8 sm:py-3.5 sm:text-2xl'
          >
            <FaPlus className='text-primary rounded-full bg-white p-1 text-lg sm:text-2xl' />내
            디자인 업로드하기
          </Link>
          <p className='text-gray-dark text-center text-xl font-bold tracking-tight sm:text-3xl'>
            오직 당신만을 위한 디자인을 선택하세요. 최고의 선물이 완성됩니다.
          </p>
          <div className='grid grid-cols-1 gap-8 sm:gap-12 lg:grid-cols-2 xl:grid-cols-3'>
            <Link href='/'>
              <Image src='/images/fashion.png' alt='패션 카테고리' width={440} height={330} />
            </Link>
            <Link href='/'>
              <Image src='/images/shoes.png' alt='신발 카테고리' width={440} height={330} />
            </Link>
            <Link href='/'>
              <Image src='/images/others.png' alt='기타 카테고리' width={440} height={330} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
