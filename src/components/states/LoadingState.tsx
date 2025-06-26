import LoadingSpinner from './LoadingSpinner';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export default function LoadingState({
  message = '로딩 중...',
  className = '',
}: LoadingStateProps) {
  const containerClass = 'flex min-h-[32rem] items-center justify-center py-24';

  return (
    <div className={`${containerClass} ${className}`}>
      <div className='text-center'>
        <LoadingSpinner size='lg' message={message} />
      </div>
    </div>
  );
}
