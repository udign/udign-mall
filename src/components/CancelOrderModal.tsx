import { useState } from 'react';

interface CancelOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (orderId: string, cancelMemo: string) => Promise<void>;
  orderId: string;
}

export default function CancelOrderModal({
  isOpen,
  onClose,
  onSubmit,
  orderId,
}: CancelOrderModalProps) {
  const [cancelMemo, setCancelMemo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cancelMemo.trim()) {
      alert('취소 사유를 입력해주세요.');
      return;
    }

    if (!confirm('주문을 정말 취소하시겠습니까?')) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(orderId, cancelMemo);
      onClose();
      setCancelMemo('');
    } catch (error) {
      console.error('Order cancel error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className='bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black'>
      <div className='mx-4 w-full max-w-md rounded-lg bg-white p-6'>
        <div className='mb-4 flex items-center justify-between'>
          <h3 className='text-lg font-semibold'>주문취소</h3>
          <button onClick={onClose} className='text-gray-400 hover:text-gray-600'>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className='mb-4'>
            <label className='mb-2 block text-sm font-medium text-gray-700'>주문취소사유</label>
            <input
              type='text'
              value={cancelMemo}
              onChange={(e) => setCancelMemo(e.target.value)}
              placeholder='주문취소사유를 입력해주세요'
              className='w-full rounded border border-gray-300 p-3 focus:border-purple-500 focus:ring-purple-500'
              maxLength={100}
              required
            />
          </div>

          <div className='flex space-x-3'>
            <button
              type='button'
              onClick={onClose}
              className='flex-1 rounded border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50'
              disabled={isSubmitting}
            >
              닫기
            </button>
            <button
              type='submit'
              className='flex-1 rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50'
              disabled={isSubmitting}
            >
              {isSubmitting ? '처리중...' : '주문취소'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
