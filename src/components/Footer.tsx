'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/primitives/button';
import { ROUTES } from '@/lib/routes';
import SocialIcons from '@/components/SocialIcons';

interface FooterNavLink {
  href: string;
  label: string;
}

const FOOTER_NAV_LINKS: FooterNavLink[] = [
  { href: ROUTES.COMPANY, label: 'about UDIGN' },
  { href: ROUTES.GUIDE, label: '이용안내' },
  { href: ROUTES.PROVISION, label: '이용약관' },
  { href: ROUTES.PRIVACY, label: '개인정보처리방침' },
  { href: ROUTES.VENDOR, label: '벤더페이지' },
  { href: ROUTES.COPYRIGHT_REPORT, label: '저작권 신고' },
];

export default function Footer() {
  const router = useRouter();

  return (
    <footer className='bg-[#0e1731] py-8 text-white'>
      <div className='mx-auto px-6 sm:px-10'>
        <div className='flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between'>
          {/* 로고 */}
          <div className='flex-shrink-0'>
            <Image src='/images/udign-white.png' alt='UDIGN' width={103} height={35} />
          </div>

          {/* 네비게이션 링크 */}
          <nav className='flex-shrink-0'>
            <ul className='flex flex-col gap-y-1'>
              {FOOTER_NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Button
                    onClick={() => router.push(link.href)}
                    variant='link'
                    className='text-sm text-white/80 hover:text-white hover:no-underline p-0 text-left'
                  >
                    {link.label}
                  </Button>
                </li>
              ))}
            </ul>
          </nav>

          {/* 회사 정보 */}
          <div className='flex-shrink-0 text-sm text-white/80'>
            <p className='mb-1'>
              <span className='font-semibold'>대표:</span> 문유성 |{' '}
              <span className='font-semibold'>전화:</span> 1577-4215 |{' '}
              <span className='font-semibold'>팩스:</span> 02-356-5889
            </p>
            <p className='mb-1'>
              <span className='font-semibold'>사업장주소:</span> 서울시 은평구 진관3로 32, 은평뉴타운파크앤타워 B동 6층 618호
            </p>
            <p className='mb-1'>
              <span className='font-semibold'>사업자등록번호:</span> 259-87-03288
            </p>
            <p className='mb-1'>
              <span className='font-semibold'>통신판매업신고번호:</span> 제 2025-서울은평-0219호
            </p>
            <p className='mb-2'>
              <span className='font-semibold'>개인정보관리책임자:</span> 문유성, 한훈희 |{' '}
              <span className='font-semibold'>E-MAIL:</span> udign0401@naver.com
            </p>
          </div>

          {/* Contact Us */}
          <div className='flex-shrink-0 text-sm'>
            <p className='font-semibold text-white mb-2'>Contact Us</p>
            <div className='text-white/80'>
              <p className='font-semibold text-lg mb-1'>1577-4215</p>
              <p>운영시간 : 평일 09:00 ~ 17:00</p>
              <p>점심시간 : 평일 12:00 ~ 13:00</p>
              <p className='mb-4'>토, 일요일 / 공휴일 휴무</p>
              <p className='font-semibold text-white mb-2'>Follow Us</p>
              <SocialIcons />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
