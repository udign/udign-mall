import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/primitives/button';
import { ROUTES } from '@/lib/routes';
import { Dictionary } from '@/lib/dictionaries';

interface ErrorStateProps {
  title?: string;
  message: string;
  showRetry?: boolean;
  showGoHome?: boolean;
  onRetry?: () => void;
  className?: string;
  dictionary?: Dictionary;
}

export default function ErrorState({
  title,
  message,
  showRetry = false,
  showGoHome = true,
  onRetry,
  className = '',
  dictionary,
}: ErrorStateProps) {
  const router = useRouter();

  const handleGoHome = () => router.push(ROUTES.HOME);

  const containerClass = 'flex min-h-[32rem] items-center justify-center py-24';

  return (
    <div className={`${containerClass} ${className}`}>
      <div className='text-center'>
        <h2 className='mb-4 text-2xl font-bold text-red-600'>
          {title || dictionary?.common.error || '오류 발생'}
        </h2>
        <p className='mb-4 text-gray-600'>{message}</p>
        <div className='flex justify-center gap-3'>
          {showRetry && onRetry && (
            <Button onClick={onRetry} className='bg-primary hover:bg-primary-hover'>
              {dictionary?.common.retry || '다시 시도'}
            </Button>
          )}
          {showGoHome && (
            <Button
              onClick={handleGoHome}
              variant={showRetry ? 'outline' : 'default'}
              className={!showRetry ? 'bg-primary hover:bg-primary-hover' : ''}
            >
              {dictionary?.common.goHome || '홈으로 돌아가기'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
