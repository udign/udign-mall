import Footer from './components/Footer';
import CategoryCards from './components/CategoryCards';

export default function Home() {
  return (
    <main>
      <div className='relative mx-10 h-96 overflow-hidden rounded-xl sm:h-screen'>
        <video
          src='/videos/main-banner-pc.mp4'
          autoPlay
          loop
          muted
          playsInline
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
      <div className='bg-gray-50'>
        <div className='max-w-container mx-auto px-3 py-8 sm:px-6 sm:py-12'>
          <section>
            <div>
              <p className='text-gray-dark mt-12 text-center text-2xl font-bold tracking-tight sm:text-3xl'>
                오직 당신만을 위한 디자인을 선택하세요. 최고의 선물이 완성됩니다.
              </p>

              {/* 카테고리 카드들 */}
              <CategoryCards />
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}
