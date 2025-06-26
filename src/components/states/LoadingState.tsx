import LoadingSpinner from './LoadingSpinner';

interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
  className?: string;
}

export default function LoadingState({
  message = '로딩 중...',
  fullScreen = false,
  className = '',
}: LoadingStateProps) {
  const containerClass = fullScreen
    ? 'flex min-h-screen items-center justify-center'
    : 'flex items-center justify-center py-8';

  return (
    <div className={`${containerClass} ${className}`}>
      <div className='text-center'>
        <LoadingSpinner size='lg' message={message} />
      </div>
    </div>
  );
}
