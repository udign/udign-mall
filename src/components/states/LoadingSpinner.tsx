import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  message?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

export default function LoadingSpinner({ size = 'md', className, message }: LoadingSpinnerProps) {
  return (
    <div className='flex flex-col items-center justify-center'>
      <div
        className={cn(
          'border-primary mx-auto mb-4 animate-spin rounded-full border-b-2',
          sizeClasses[size],
          className,
        )}
      />
      {message && <p className='text-center text-gray-600'>{message}</p>}
    </div>
  );
}
