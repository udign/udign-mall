import LoadingSpinner from '@/components/states/LoadingSpinner';
import { Dictionary } from '@/lib/dictionaries';

interface LoadingStateProps {
  message?: string;
  className?: string;
  dictionary?: Dictionary;
}

export default function LoadingState({ message, className = '', dictionary }: LoadingStateProps) {
  const containerClass = 'flex min-h-[32rem] items-center justify-center py-24';

  return (
    <div className={`${containerClass} ${className}`}>
      <div className='text-center'>
        <LoadingSpinner size='lg' message={message || dictionary?.common.loading || '로딩 중...'} />
      </div>
    </div>
  );
}
