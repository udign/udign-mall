import Header from '@/app/components/Header';
import Footer from './components/Footer';
import BannerCarousel from './components/BannerCarousel';
import CategoryCards from './components/CategoryCards';

export default function Home() {
  return (
    <>
      <Header />

      {/* 메인 배너 캐러셀 */}
      <BannerCarousel />

      {/* 메인 콘텐츠 */}
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
    </>
  );
}
