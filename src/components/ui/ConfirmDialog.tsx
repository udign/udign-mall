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

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => void;
  onCancel?: () => void;
}

export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = '확인',
  cancelText = '취소',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogFooter className='flex-col gap-2 sm:flex-row sm:gap-2'>
          <Button onClick={handleCancel} variant='outline'>
            {cancelText}
          </Button>
          <Button onClick={handleConfirm} variant={variant}>
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
