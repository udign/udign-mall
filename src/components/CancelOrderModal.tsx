import { useState } from 'react';
import { Button } from '@/components/ui/primitives/button';
import FormDialog from '@/components/ui/FormDialog';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import MessageDialog from '@/components/ui/MessageDialog';

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
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [messageContent, setMessageContent] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cancelMemo.trim()) {
      setMessageContent('취소 사유를 입력해주세요.');
      setShowMessageDialog(true);
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleConfirmCancel = async () => {
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
    <>
      <FormDialog open={isOpen} onOpenChange={onClose} title='주문취소'>
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
      </FormDialog>

      <ConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        title='주문취소 확인'
        description='주문을 정말 취소하시겠습니까?'
        onConfirm={handleConfirmCancel}
        variant='destructive'
        confirmText='취소하기'
      />

      <MessageDialog
        open={showMessageDialog}
        onOpenChange={setShowMessageDialog}
        title='알림'
        description={messageContent}
      />
    </>
  );
}
