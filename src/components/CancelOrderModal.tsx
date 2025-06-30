import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/primitives/dialog';
import { Button } from '@/components/ui/primitives/button';

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>주문취소</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
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
            <Button
              type='button'
              onClick={onClose}
              variant='outline'
              className='flex-1'
              disabled={isSubmitting}
            >
              닫기
            </Button>
            <Button type='submit' variant='destructive' className='flex-1' disabled={isSubmitting}>
              {isSubmitting ? '처리중...' : '주문취소'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
