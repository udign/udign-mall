import Image from 'next/image';
import Link from 'next/link';

const navigationLinks = [
  { href: '/about', label: 'about UDIGN' },
  { href: '/guide', label: '이용안내' },
  { href: '/terms', label: '이용약관' },
  { href: '/privacy', label: '개인정보처리방침' },
  { href: '/band', label: '벤더페이지' },
];

export default function Footer() {
  return (
    <footer className='space-y-10 border-t border-gray-200 px-6 py-6 sm:px-10 lg:space-y-20'>
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
      <div>
        <div className='text-gray-dark flex flex-wrap items-center justify-center gap-4 text-sm'>
          {navigationLinks.map((link, index) => (
            <div key={link.href} className='flex items-center gap-4'>
              <Link href={link.href} className='hover:text-primary-hover transition-colors'>
                {link.label}
              </Link>
              {index < navigationLinks.length - 1 && <div className='h-4 w-px bg-gray-400' />}
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
