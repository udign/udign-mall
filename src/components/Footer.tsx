import Image from 'next/image';
import Link from 'next/link';
import { ROUTES } from '@/lib/routes';
import { YouTubeIcon, InstagramIcon, KakaoTalkIcon, GmailIcon } from './SocialIcons';

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
];

export default function Footer() {
  return (
    <footer className='space-y-8 border-t border-gray-200 px-6 py-6 sm:px-10'>
      <div className='mx-auto max-w-7xl flex-row justify-between space-y-10 lg:flex lg:space-y-0'>
        <div className='mb-10 flex justify-center lg:mb-0 lg:flex-shrink-0 lg:justify-start'>
          <Image src='/images/udign-footer.png' alt='UDIGN' width={150} height={60} />
        </div>
        <div className='text-gray-light text-sm leading-7'>
          <p className='font-bold text-black'>(주)유다인</p>
          <p>대표 : 문유성 | 전화 : 1577-4215 | 팩스 : 02-356-5889</p>
          <p>사업장주소 : 서울시 은평구 진관3로 32, 은평뉴타운파크앤타워 B동 6층 618호</p>
          <p>
            사업자등록번호 : 259-87-03288 | 통신판매업신고번호 : 제 2025-서울은평-0219호
            [사업자정보확인]
          </p>
          <p>개인정보관리책임자 : 문유성, 한훈희 | E-MAIL : udign0401@naver.com</p>
        </div>
        <div className='text-gray-light text-sm leading-7'>
          <p className='font-bold text-black'>고객센터 1577-4215</p>
          <p>운영시간 : 평일 09:00 ~ 17:00</p>
          <p>점심시간 : 평일 12:00 ~ 13:00</p>
          <p>토,일요일/공휴일 휴무</p>
        </div>
      </div>

      {/* 소셜 미디어 섹션 */}
      <div className='flex flex-col items-center'>
        <div className='flex space-x-4'>
          <a
            href='https://youtube.com/@udign?si=qfjEDralJY9zD_O9'
            target='_blank'
            rel='noopener noreferrer'
            className='rounded-full bg-gray-50 p-2 transition-opacity hover:bg-gray-100 hover:opacity-70'
            aria-label='YouTube'
          >
            <YouTubeIcon size={20} />
          </a>
          <a
            href='https://www.instagram.com/udign.official?igsh=MXA2OHY2OWs0NjlnZw%3D%3D&utm_source=qr'
            target='_blank'
            rel='noopener noreferrer'
            className='rounded-full bg-gray-50 p-2 transition-opacity hover:bg-gray-100 hover:opacity-70'
            aria-label='Instagram'
          >
            <InstagramIcon size={20} />
          </a>
          <a
            href='http://pf.kakao.com/_wxatbn'
            target='_blank'
            rel='noopener noreferrer'
            className='rounded-full bg-gray-50 p-2 transition-opacity hover:bg-gray-100 hover:opacity-70'
            aria-label='KakaoTalk'
          >
            <KakaoTalkIcon size={20} />
          </a>
          <a
            href='mailto:udign0401@gmail.com'
            className='rounded-full bg-gray-50 p-2 transition-opacity hover:bg-gray-100 hover:opacity-70'
            aria-label='Email'
          >
            <GmailIcon size={20} />
          </a>
        </div>
      </div>

      <div>
        <div className='text-gray-dark flex flex-wrap items-center justify-center gap-4 text-sm'>
          {FOOTER_NAV_LINKS.map((link, index) => (
            <div key={link.href} className='flex items-center gap-4'>
              <Link href={link.href} className='hover:text-primary-hover transition-colors'>
                {link.label}
              </Link>
              {index < FOOTER_NAV_LINKS.length - 1 && <div className='h-4 w-px bg-gray-400' />}
            </div>
          ))}
        </div>
        <div className='text-gray-dark mt-2 text-center text-sm'>
          Copyright © <strong>udign.com</strong>. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
