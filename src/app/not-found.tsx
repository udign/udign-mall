import Link from 'next/link';
import { Button } from '@/components/ui/primitives/button';
import { FaHome } from 'react-icons/fa';
import { ROUTES } from '@/lib/routes';

export default function NotFound() {
  return (
    <main className='flex min-h-screen items-center justify-center px-6 py-20'>
      <div className='text-center'>
        <div className='mb-12'>
          <h1 className='text-primary mb-4 text-7xl font-bold'>404</h1>
          <h2 className='text-gray-dark mb-4 text-2xl font-bold sm:text-3xl'>
            페이지를 찾을 수 없습니다
          </h2>
          <p className='mx-auto text-lg leading-relaxed text-gray-600 sm:text-xl'>
            요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
            <br />
            주소를 다시 확인해주세요.
          </p>
        </div>

        <div className='flex flex-col gap-4 sm:flex-row sm:justify-center sm:gap-6'>
          <Link href={ROUTES.SHOP}>
            <Button className='h-12 w-full gap-2 rounded-2xl px-8 text-lg sm:w-auto' size='lg'>
              <FaHome className='text-lg' />
              홈으로 돌아가기
            </Button>
          </Link>
        </div>

        <div className='mt-16 text-center'>
          <p className='text-sm text-gray-500'>
            계속해서 문제가 발생하시면{' '}
            <Link href={ROUTES.SHOP} className='text-primary hover:underline'>
              고객센터
            </Link>
            로 문의해주세요.
          </p>
        </div>
      </div>
    </main>
  );
}
