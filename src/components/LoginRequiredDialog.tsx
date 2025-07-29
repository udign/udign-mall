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
import { Dictionary } from '@/lib/dictionaries';

interface LoginRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  dictionary?: Dictionary;
}

export default function LoginRequiredDialog({
  open,
  onOpenChange,
  title,
  description,
  dictionary,
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
          <DialogTitle>
            {title || dictionary?.header.loginRequired || '로그인이 필요합니다'}
          </DialogTitle>
          <DialogDescription>
            {description ||
              dictionary?.header.loginRequiredDesc ||
              '회원이시라면 로그인 후 이용해 주십시오.'}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className='flex-col gap-2 sm:flex-row sm:gap-2'>
          <Button variant='outline' onClick={handleCancel} className='w-full sm:w-auto'>
            {dictionary?.common.cancel || '취소'}
          </Button>
          <Button onClick={handleLoginConfirm} className='w-full sm:w-auto'>
            {dictionary?.common.confirm || '확인'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
