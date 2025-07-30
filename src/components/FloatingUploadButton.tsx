'use client';

import { Button } from '@/components/ui/primitives/button';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/lib/routes';
import LoginRequiredDialog from '@/components/LoginRequiredDialog';
import { Dictionary } from '@/lib/dictionaries';

interface FloatingUploadButtonProps {
  dictionary: Dictionary;
}

export default function FloatingUploadButton({ dictionary }: FloatingUploadButtonProps) {
  const [showLoginDialog, setShowLoginDialog] = useState<boolean>(false);
  const [isButtonOpen, setIsButtonOpen] = useState<boolean>(true);

  const router = useRouter();
  const { user, isLoading } = useAuth();

  const handleUploadClick = (e: React.MouseEvent) => {
    e.preventDefault();

    if (isLoading) {
      return;
    }

    if (!user) {
      setShowLoginDialog(true);
    } else {
      router.push(ROUTES.UPLOAD);
    }
  };

  const toggleButton = () => {
    setIsButtonOpen(!isButtonOpen);
  };

  return (
    <>
      {/* 플로팅 업로드 버튼 */}
      <div className='fixed top-1/3 left-0 z-40 -translate-y-1/2'>
        <div
          className='flex items-center transition-transform duration-300 ease-in-out'
          style={{
            transform: isButtonOpen ? 'translateX(0)' : 'translateX(calc(-100% + 32px))',
          }}
        >
          <Button
            onClick={handleUploadClick}
            disabled={isLoading}
            className='flex h-12 items-center gap-2 rounded-none px-6 text-white shadow-lg'
            style={{ backgroundColor: '#618e49' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#4a6e37')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#618e49')}
          >
            <span className='text-base font-semibold'>{dictionary.shop.uploadProduct}</span>
          </Button>
          <button
            onClick={toggleButton}
            className='flex h-12 w-8 items-center justify-center rounded-none text-white shadow-lg transition-colors'
            style={{ backgroundColor: '#618e49' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#4a6e37')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#618e49')}
          >
            {isButtonOpen ? (
              <ChevronLeft className='h-5 w-5' />
            ) : (
              <ChevronRight className='h-5 w-5' />
            )}
          </button>
        </div>
      </div>

      <LoginRequiredDialog
        open={showLoginDialog}
        onOpenChange={setShowLoginDialog}
        title={dictionary.shop.loginRequired}
        description={dictionary.shop.loginRequiredMessage}
      />
    </>
  );
}
