import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/primitives';
import { ROUTES } from '@/lib/routes';

interface NotFoundStateProps {
  title?: string;
  message?: string;
  showGoHome?: boolean;
  className?: string;
}

export default function NotFoundState({
  title = '페이지를 찾을 수 없습니다',
  message,
  showGoHome = true,
  className = '',
}: NotFoundStateProps) {
  const router = useRouter();

  const handleGoHome = () => {
    router.push(ROUTES.HOME);
  };

  const containerClass = 'flex min-h-[32rem] items-center justify-center py-24';

  return (
    <div className={`${containerClass} ${className}`}>
      <div className='text-center'>
        <h2 className='mb-4 text-2xl font-bold text-gray-800'>{title}</h2>
        {message && <p className='mb-4 text-gray-600'>{message}</p>}
        {showGoHome && (
          <Button onClick={handleGoHome} className='bg-primary hover:bg-primary-hover'>
            홈으로 돌아가기
          </Button>
        )}
      </div>
    </div>
  );
}
