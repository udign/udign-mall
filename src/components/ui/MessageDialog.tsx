'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/primitives/dialog';
import { Button } from '@/components/ui/primitives/button';

import { Dictionary } from '@/lib/dictionaries';

interface MessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmText?: string;
  onConfirm?: () => void;
  dictionary?: Dictionary;
}

export default function MessageDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText,
  onConfirm,
  dictionary,
}: MessageDialogProps) {
  const handleConfirm = () => {
    onConfirm?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='text-center text-lg font-semibold'>{title}</DialogTitle>
          {description && (
            <DialogDescription className='text-center leading-relaxed text-gray-700'>
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <DialogFooter className='sm:justify-center'>
          <Button onClick={handleConfirm} variant='default' className='px-8'>
            {confirmText || dictionary?.common.confirm || '확인'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
