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
    <footer className='bg-[#0e1731] py-12 text-white'>
      <div className='mx-auto px-6 sm:px-10'>
        <div className='mb-8 flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-between'>
          <div className='flex flex-col items-center gap-4 sm:items-start'>
            <Image src='/images/udign-white.png' alt='UDIGN' width={103} height={35} />
            <SocialIcons />
          </div>
          <nav className='mt-4 sm:mt-0'>
            <ul className='flex flex-wrap justify-center gap-4 sm:justify-end'>
              {FOOTER_NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Button
                    onClick={() => router.push(link.href)}
                    variant='link'
                    className='text-sm text-white hover:text-white/80 hover:no-underline p-0'
                  >
                    {link.label}
                  </Button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className='border-t border-white/20 pt-8'>
          <div className='text-center text-sm text-white/80 sm:text-left'>
            <p className='mb-2'>
              <span className='font-semibold'>상호명:</span> 유다인 |{' '}
              <span className='font-semibold'>대표자:</span> 이지욱 |{' '}
              <span className='font-semibold'>사업자등록번호:</span> 881-63-00646
            </p>
            <p className='mb-2'>
              <span className='font-semibold'>통신판매업신고번호:</span> 제2024-대구북구-0161호 |{' '}
              <span className='font-semibold'>주소:</span> 대구광역시 북구 대현남로 3길 21-8 2층 201호
            </p>
            <p className='mb-2'>
              <span className='font-semibold'>고객센터:</span> 1833-5462 (평일 9:00 ~ 18:00 / 점심
              12:00 ~ 13:00) |{' '}
              <span className='font-semibold'>이메일:</span>{' '}
              <a href='mailto:teamiudan5@gmail.com' className='text-white hover:text-white/80'>
                teamiudan5@gmail.com
              </a>
            </p>
            <div className='mt-4 space-y-2'>
              <p>
                유다인은 통신판매중개자이며, 통신판매의 당사자가 아닙니다. 상품, 상품정보, 거래에
                관한 의무와 책임은 판매자에게 있습니다.
              </p>
              <p>
                유다인은 소비자보호와 안전거래를 위해 신뢰관리센터(udign@email.com)를 운영하고
                있으며, 분쟁이 발생 된 경우 별도의 분쟁처리절차에 의거 분쟁해결 및 청약철회 등이
                진행됩니다.
              </p>
            </div>
            <p className='mt-6 text-white/60'>© 2024 UDIGN. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
