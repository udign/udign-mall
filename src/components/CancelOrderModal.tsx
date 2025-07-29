import { useState } from 'react';
import { Button } from '@/components/ui/primitives/button';
import FormDialog from '@/components/ui/FormDialog';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import MessageDialog from '@/components/ui/MessageDialog';
import { Dictionary } from '@/lib/dictionaries';

interface CancelOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (orderId: string, cancelMemo: string) => Promise<void>;
  orderId: string;
  dictionary: Dictionary;
}

export default function CancelOrderModal({
  isOpen,
  onClose,
  onSubmit,
  orderId,
  dictionary,
}: CancelOrderModalProps) {
  const [cancelMemo, setCancelMemo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [messageContent, setMessageContent] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cancelMemo.trim()) {
      setMessageContent(dictionary.myUdign.dialogs.cancel.reasonRequired);
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
      <FormDialog
        open={isOpen}
        onOpenChange={onClose}
        title={dictionary.myUdign.dialogs.cancel.title}
      >
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label className='mb-2 block text-sm font-medium text-gray-700'>
              {dictionary.myUdign.dialogs.cancel.reasonLabel}
            </label>
            <input
              type='text'
              value={cancelMemo}
              onChange={(e) => setCancelMemo(e.target.value)}
              placeholder={dictionary.myUdign.dialogs.cancel.reasonPlaceholder}
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
              {isSubmitting
                ? dictionary.common.loading
                : dictionary.myUdign.dialogs.cancel.submitButton}
            </Button>
          </div>
        </form>
      </FormDialog>

      <ConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        title={dictionary.myUdign.dialogs.cancel.confirmTitle}
        description={dictionary.myUdign.dialogs.cancel.confirmMessage}
        onConfirm={handleConfirmCancel}
        variant='destructive'
        confirmText={dictionary.myUdign.dialogs.cancel.submitButton}
      />

      <MessageDialog
        open={showMessageDialog}
        onOpenChange={setShowMessageDialog}
        title={dictionary.myUdign.notification}
        description={messageContent}
      />
    </>
  );
}
