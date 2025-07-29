'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/primitives/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/primitives/dropdown-menu';
import { i18n, type Locale } from '../../i18n.config';

const languageNames = {
  ko: '한국어',
  en: 'English',
  ja: '日本語',
  zh: '中文',
};

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();

  const switchLanguage = (newLocale: Locale) => {
    if (!pathname) return;

    // 쿠키에 언어 저장 (1년간 유지)
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;

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

    router.push(newPath);
  };

  const getCurrentLocale = (): Locale => {
    if (!pathname) return i18n.defaultLocale;

    const segments = pathname.split('/');
    const currentLocale = segments[1];

    if (i18n.locales.includes(currentLocale as Locale)) {
      return currentLocale as Locale;
    }

    return i18n.defaultLocale;
  };

  const currentLocale = getCurrentLocale();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='hover:bg-white/10 hover:text-white'>
          <Languages className='text-xl text-white' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-32'>
        {i18n.locales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => switchLanguage(locale)}
            className={`cursor-pointer ${currentLocale === locale && 'bg-gray-100 font-semibold'}`}
          >
            {languageNames[locale]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
