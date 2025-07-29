'use client';

import Image from 'next/image';
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
                    className='p-0 text-left text-sm text-white/80 hover:text-white hover:no-underline'
                  >
                    {dictionary.footer[link.labelKey]}
                  </Button>
                </li>
              ))}
            </ul>
          </nav>

          {/* 회사 정보 */}
          <div className='flex-shrink-0 text-sm text-white/80'>
            <p className='mb-1'>
              <span className='font-semibold'>{dictionary.footer.company.representative}:</span>{' '}
              문유성 | <span className='font-semibold'>{dictionary.footer.company.phone}:</span>{' '}
              1577-4215 | <span className='font-semibold'>{dictionary.footer.company.fax}:</span>{' '}
              02-356-5889
            </p>
            <p className='mb-1'>
              <span className='font-semibold'>{dictionary.footer.company.address}:</span>{' '}
              {dictionary.footer.company.addressValue}
            </p>
            <p className='mb-1'>
              <span className='font-semibold'>{dictionary.footer.company.businessNumber}:</span>{' '}
              259-87-03288
            </p>
            <p className='mb-1'>
              <span className='font-semibold'>{dictionary.footer.company.ecommerceNumber}:</span> 제
              2025-서울은평-0219호
            </p>
            <p className='mb-2'>
              <span className='font-semibold'>{dictionary.footer.company.privacyManager}:</span>{' '}
              문유성, 한훈희 |{' '}
              <span className='font-semibold'>{dictionary.footer.company.email}:</span>{' '}
              udign0401@naver.com
            </p>
          </div>

          {/* Contact Us */}
          <div className='flex-shrink-0 text-sm'>
            <p className='mb-2 font-semibold text-white'>{dictionary.footer.contact.title}</p>
            <div className='text-white/80'>
              <p className='mb-1 text-lg font-semibold'>{dictionary.footer.contact.phone}</p>
              <p>{dictionary.footer.contact.operatingHours}</p>
              <p>{dictionary.footer.contact.lunchTime}</p>
              <p className='mb-4'>{dictionary.footer.contact.holiday}</p>
              <p className='mb-2 font-semibold text-white'>{dictionary.footer.contact.followUs}</p>
              <SocialIcons />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
