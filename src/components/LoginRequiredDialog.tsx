import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/primitives/dialog';
import { Button } from '@/components/ui/primitives/button';
import { ROUTES } from '@/lib/routes';

interface LoginRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
}

export default function LoginRequiredDialog({
  open,
  onOpenChange,
  title = '로그인이 필요합니다',
  description = '회원이시라면 로그인 후 이용해 주십시오.',
}: LoginRequiredDialogProps) {
  const router = useRouter();

  const handleLoginConfirm = () => {
    onOpenChange(false);
    router.push(ROUTES.LOGIN);
  };

  const handleCancel = () => onOpenChange(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className='flex-col gap-2 sm:flex-row sm:gap-2'>
          <Button variant='outline' onClick={handleCancel} className='w-full sm:w-auto'>
            취소
          </Button>
          <Button onClick={handleLoginConfirm} className='w-full sm:w-auto'>
            확인
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
