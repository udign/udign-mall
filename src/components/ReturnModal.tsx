import { useState } from 'react';
import { Button } from '@/components/ui/primitives/button';
import FormDialog from '@/components/ui/FormDialog';
import MessageDialog from '@/components/ui/MessageDialog';
import { Dictionary } from '@/lib/dictionaries';

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
  dictionary: Dictionary;
}

export default function ReturnModal({
  isOpen,
  onClose,
  onSubmit,
  orderId,
  dictionary,
}: ReturnModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    returnType: 'exchange' as 'exchange' | 'return',
    reason: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [messageContent, setMessageContent] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.phone || !formData.reason) {
      setMessageContent(dictionary.myUdign.dialogs.return.allFieldsRequired);
      setShowMessageDialog(true);
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

  return (
    <>
      <FormDialog
        open={isOpen}
        onOpenChange={onClose}
        title={dictionary.myUdign.dialogs.return.title}
      >
        <form onSubmit={handleSubmit}>
          <div className='space-y-4'>
            <div>
              <label className='mb-1 block text-sm font-medium text-gray-700'>
                {dictionary.myUdign.dialogs.return.nameLabel}
              </label>
              <input
                type='text'
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={dictionary.myUdign.dialogs.return.namePlaceholder}
                className='w-full rounded border border-gray-300 p-2 focus:border-purple-500 focus:ring-purple-500'
                required
              />
            </div>

            <div>
              <label className='mb-1 block text-sm font-medium text-gray-700'>
                {dictionary.myUdign.dialogs.return.phoneLabel}
              </label>
              <input
                type='tel'
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder={dictionary.myUdign.dialogs.return.phonePlaceholder}
                className='w-full rounded border border-gray-300 p-2 focus:border-purple-500 focus:ring-purple-500'
                required
              />
            </div>

            <div>
              <label className='mb-1 block text-sm font-medium text-gray-700'>
                {dictionary.myUdign.dialogs.return.typeLabel}
              </label>
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
                  {dictionary.myUdign.dialogs.return.exchange}
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
                  {dictionary.myUdign.dialogs.return.return}
                </label>
              </div>
            </div>

            <div>
              <label className='mb-1 block text-sm font-medium text-gray-700'>
                {dictionary.myUdign.dialogs.return.reasonLabel}
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder={dictionary.myUdign.dialogs.return.reasonPlaceholder}
                rows={4}
                className='w-full rounded border border-gray-300 p-2 focus:border-purple-500 focus:ring-purple-500'
                required
              />
            </div>
          </div>

          <div className='mt-6 flex space-x-3'>
            <Button
              type='button'
              onClick={onClose}
              variant='outline'
              className='flex-1'
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button type='submit' variant='default' className='flex-1' disabled={isSubmitting}>
              {isSubmitting
                ? dictionary.common.loading
                : dictionary.myUdign.dialogs.return.submitButton}
            </Button>
          </div>
        </form>
      </FormDialog>

      <MessageDialog
        open={showMessageDialog}
        onOpenChange={setShowMessageDialog}
        title={dictionary.myUdign.notification}
        description={messageContent}
      />
    </>
  );
}
