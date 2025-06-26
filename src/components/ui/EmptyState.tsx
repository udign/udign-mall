interface EmptyStateProps {
  title?: string;
  message?: string;
  className?: string;
}

export default function EmptyState({
  title = '데이터가 없습니다',
  message,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`py-16 text-center ${className}`}>
      <h3 className='mb-2 text-lg font-medium text-gray-900'>{title}</h3>
      {message && <p className='text-gray-500'>{message}</p>}
    </div>
  );
}
