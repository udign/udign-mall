import { useState } from 'react';

interface ReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    orderId: string;
    name: string;
    phone: string;
    returnType: 'exchange' | 'return';
    reason: string;
  }) => Promise<void>;
  orderId: string;
}

export default function ReturnModal({ isOpen, onClose, onSubmit, orderId }: ReturnModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    returnType: 'exchange' as 'exchange' | 'return',
    reason: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.phone || !formData.reason) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        orderId,
        ...formData,
      });
      onClose();
      setFormData({ name: '', phone: '', returnType: 'exchange', reason: '' });
    } catch (error) {
      console.error('Return submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className='bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black'>
      <div className='mx-4 w-full max-w-md rounded-lg bg-white p-6'>
        <div className='mb-4 flex items-center justify-between'>
          <h3 className='text-lg font-semibold'>교환/반품 신청</h3>
          <button onClick={onClose} className='text-gray-400 hover:text-gray-600'>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className='space-y-4'>
            <div>
              <label className='mb-1 block text-sm font-medium text-gray-700'>이름</label>
              <input
                type='text'
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className='w-full rounded border border-gray-300 p-2 focus:border-purple-500 focus:ring-purple-500'
                required
              />
            </div>

            <div>
              <label className='mb-1 block text-sm font-medium text-gray-700'>전화번호</label>
              <input
                type='tel'
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className='w-full rounded border border-gray-300 p-2 focus:border-purple-500 focus:ring-purple-500'
                required
              />
            </div>

            <div>
              <label className='mb-1 block text-sm font-medium text-gray-700'>교환/반품 선택</label>
              <div className='flex space-x-4'>
                <label className='flex items-center'>
                  <input
                    type='radio'
                    value='exchange'
                    checked={formData.returnType === 'exchange'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        returnType: e.target.value as 'exchange' | 'return',
                      })
                    }
                    className='mr-2'
                  />
                  교환
                </label>
                <label className='flex items-center'>
                  <input
                    type='radio'
                    value='return'
                    checked={formData.returnType === 'return'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        returnType: e.target.value as 'exchange' | 'return',
                      })
                    }
                    className='mr-2'
                  />
                  반품
                </label>
              </div>
            </div>

            <div>
              <label className='mb-1 block text-sm font-medium text-gray-700'>사유</label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows={4}
                className='w-full rounded border border-gray-300 p-2 focus:border-purple-500 focus:ring-purple-500'
                required
              />
            </div>
          </div>

          <div className='mt-6 flex space-x-3'>
            <button
              type='button'
              onClick={onClose}
              className='flex-1 rounded border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50'
              disabled={isSubmitting}
            >
              취소
            </button>
            <button
              type='submit'
              className='flex-1 rounded bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 disabled:opacity-50'
              disabled={isSubmitting}
            >
              {isSubmitting ? '처리중...' : '제출'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
