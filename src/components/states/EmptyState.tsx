import { Dictionary } from '@/lib/dictionaries';

interface EmptyStateProps {
  title?: string;
  message?: string;
  className?: string;
  dictionary?: Dictionary;
}

export default function EmptyState({
  title,
  message,
  className = '',
  dictionary,
}: EmptyStateProps) {
  const defaultTitle = title || dictionary?.common?.noData || '데이터가 없습니다';

  return (
    <div className={`py-16 text-center ${className}`}>
      <h3 className='mb-2 text-lg font-medium text-gray-900'>{defaultTitle}</h3>
      {message && <p className='text-gray-500'>{message}</p>}
    </div>
  );
}
