'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/primitives/dialog';
import { Button } from '@/components/ui/primitives/button';
import { i18n, type Locale } from '../../i18n.config';
import { Globe } from 'lucide-react';

interface LanguageSelectionDialogProps {
  open: boolean;
  onClose: () => void;
}

const languageOptions = [
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
];

export default function LanguageSelectionDialog({ open, onClose }: LanguageSelectionDialogProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChanging, setIsChanging] = useState(false);

  const handleLanguageSelect = async (newLocale: Locale) => {
    if (isChanging) return;

    setIsChanging(true);

    try {
      // 쿠키에 언어 저장 (1년간 유지)
      document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;

      // localStorage에도 저장해서 최초 방문 체크에 사용
      localStorage.setItem('language_selected', 'true');
      localStorage.setItem('preferred_language', newLocale);

      // 현재 경로에서 언어 부분을 제거
      const segments = pathname.split('/');

      // 첫 번째 세그먼트가 언어 코드인지 확인
      const currentLocale = segments[1];
      const isCurrentLocaleValid = i18n.locales.includes(currentLocale as Locale);

      let newPath: string;
      if (isCurrentLocaleValid) {
        // 현재 언어를 새 언어로 교체
        segments[1] = newLocale;
        newPath = segments.join('/');
      } else {
        // 언어 코드가 없는 경우 앞에 추가
        newPath = `/${newLocale}${pathname}`;
      }

      onClose();
      router.push(newPath);
    } catch (error) {
      console.error('Language change failed:', error);
      setIsChanging(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center justify-center gap-2 text-center'>
            <Globe className='h-5 w-5' />
            언어를 선택해주세요
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-3 py-4'>
          <p className='mb-6 text-center text-sm text-gray-600'>
            UDIGN 쇼핑몰을 이용하실 언어를 선택해주세요.
          </p>

          <div className='grid grid-cols-2 gap-3'>
            {languageOptions.map((language) => (
              <Button
                key={language.code}
                variant='outline'
                className='flex h-16 flex-col items-center justify-center gap-2 transition-colors hover:border-blue-300 hover:bg-blue-50'
                onClick={() => handleLanguageSelect(language.code as Locale)}
                disabled={isChanging}
              >
                <span className='text-2xl'>{language.flag}</span>
                <span className='text-sm font-medium'>{language.name}</span>
              </Button>
            ))}
          </div>

          <p className='mt-6 text-center text-xs text-gray-500'>
            언어는 나중에 상단 메뉴에서 변경할 수 있습니다.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
