'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/primitives/button';
import { ROUTES } from '@/lib/routes';
import SocialIcons from '@/components/SocialIcons';
import { Dictionary } from '@/lib/dictionaries';

interface FooterNavLink {
  href: string;
  labelKey:
    | 'aboutUdign'
    | 'userGuide'
    | 'termsOfUse'
    | 'privacyPolicy'
    | 'vendorPage'
    | 'copyrightReport';
}

interface FooterProps {
  dictionary: Dictionary;
}

const FOOTER_NAV_LINKS: FooterNavLink[] = [
  { href: ROUTES.COMPANY, labelKey: 'aboutUdign' },
  { href: ROUTES.GUIDE, labelKey: 'userGuide' },
  { href: ROUTES.PROVISION, labelKey: 'termsOfUse' },
  { href: ROUTES.PRIVACY, labelKey: 'privacyPolicy' },
  { href: ROUTES.VENDOR, labelKey: 'vendorPage' },
  { href: ROUTES.COPYRIGHT_REPORT, labelKey: 'copyrightReport' },
];

export default function Footer({ dictionary }: FooterProps) {
  const router = useRouter();
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);

  return (
    <footer className='bg-[#0e1731] py-8 text-white'>
      <div className='mx-auto max-w-7xl px-6 sm:px-10'>
        <div className='flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-start lg:justify-between'>
          {/* 로고 */}
          <div className='flex flex-shrink-0 items-center justify-center lg:justify-start lg:self-center'>
            <Image
              src='/images/footer-logo.png'
              alt='UDIGN'
              width={200}
              height={68}
              className='object-contain'
            />
          </div>

          {/* (주)유다인 + 네비게이션 링크 */}
          <div className='flex-shrink-0'>
            <p className='text-md mt-1 mb-6 font-semibold text-white'>(주)유다인</p>
            <nav>
              <ul className='flex flex-col gap-y-1'>
                {FOOTER_NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <Button
                      onClick={() => router.push(link.href)}
                      variant='link'
                      className='p-0 text-left text-sm text-white/80 hover:text-white hover:no-underline'
                    >
                      {dictionary.footer[link.labelKey]}
                    </Button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* info. + 버튼과 회사 정보 */}
          <div className='min-w-0 flex-1 text-sm lg:max-w-md'>
            <button
              onClick={() => setIsInfoExpanded(!isInfoExpanded)}
              className='mb-2 flex cursor-pointer items-center gap-2 text-white/80 hover:text-white'
            >
              <span className='text-md font-semibold'>info.</span>
              <span className='text-lg font-bold'>{isInfoExpanded ? '−' : '+'}</span>
            </button>

            {isInfoExpanded && (
              <div className='text-white/80'>
                <div className='mb-1 flex flex-col sm:flex-row sm:flex-wrap sm:gap-x-4'>
                  <span>
                    <span className='font-semibold'>
                      {dictionary.footer.company.representative}:
                    </span>{' '}
                    문유성
                  </span>
                  <span>
                    <span className='font-semibold'>{dictionary.footer.company.phone}:</span>{' '}
                    1577-4215
                  </span>
                  <span>
                    <span className='font-semibold'>{dictionary.footer.company.fax}:</span>{' '}
                    02-356-5889
                  </span>
                </div>
                <p className='mb-1 break-words'>
                  <span className='font-semibold'>{dictionary.footer.company.address}:</span>{' '}
                  {dictionary.footer.company.addressValue}
                </p>
                <p className='mb-1'>
                  <span className='font-semibold'>{dictionary.footer.company.businessNumber}:</span>{' '}
                  259-87-03288
                </p>
                <p className='mb-1 break-words'>
                  <span className='font-semibold'>
                    {dictionary.footer.company.ecommerceNumber}:
                  </span>{' '}
                  제 2025-서울은평-0219호
                </p>
                <div className='mb-2 flex flex-col sm:flex-row sm:flex-wrap sm:gap-x-4'>
                  <span>
                    <span className='font-semibold'>
                      {dictionary.footer.company.privacyManager}:
                    </span>{' '}
                    문유성, 한훈희
                  </span>
                  <span className='break-all'>
                    <span className='font-semibold'>{dictionary.footer.company.email}:</span>{' '}
                    udign0401@naver.com
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Contact Us + 전화번호 같은 라인 */}
          <div className='min-w-0 flex-shrink-0 text-sm lg:min-w-[200px]'>
            <div className='mb-2 flex items-center gap-4'>
              <p className='text-lg font-semibold text-white'>{dictionary.footer.contact.title}</p>
              <p className='text-lg font-semibold text-white'>{dictionary.footer.contact.phone}</p>
            </div>
            <div className='text-white/80'>
              <p className='break-words'>{dictionary.footer.contact.operatingHours}</p>
              <p className='break-words'>{dictionary.footer.contact.lunchTime}</p>
              <p className='mb-4 break-words'>{dictionary.footer.contact.holiday}</p>
              <p className='mb-2 font-semibold text-white'>{dictionary.footer.contact.followUs}</p>
              <SocialIcons />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
