'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HiOutlineSearch, HiOutlineMenu } from 'react-icons/hi';
import { FiBox } from 'react-icons/fi';
import { FaRegUserCircle } from 'react-icons/fa';
import { IoIosArrowDown } from 'react-icons/io';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/lib/routes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui';
import LoginRequiredDialog from '@/components/LoginRequiredDialog';
import { LoadingSpinner } from '@/components/ui';

interface NavMenuItem {
  href: string;
  label: string;
  requiresAuth?: boolean;
}

const NAV_MENU_ITEMS: NavMenuItem[] = [
  { href: ROUTES.FASHION, label: 'fashion' },
  { href: ROUTES.SHOES, label: 'shoes' },
  { href: ROUTES.OTHERS, label: 'others' },
  { href: ROUTES.UPLOAD, label: '디자인 업로드', requiresAuth: true },
];

export default function Header() {
  const [showLoginDialog, setShowLoginDialog] = useState<boolean>(false);

  const { user, logout, isLoading } = useAuth();

  const router = useRouter();

  const handleLogout = async () => {
    await logout();
  };

  const handleAuthRequiredClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault();

    if (isLoading) {
      return;
    }

    if (!user) {
      setShowLoginDialog(true);
    } else {
      router.push(href);
    }
  };

  return (
    <>
      <header className='sticky top-0 z-50 bg-white'>
        <div className='space-y-5 px-6 py-5 sm:px-10'>
          <div className='flex items-center gap-3'>
            <div className='non-login'>
              <Link href={ROUTES.HOME} className='flex items-center'>
                <Image
                  src='/images/udign-header.png'
                  alt='UDIGN'
                  width={100}
                  height={40}
                  className='h-auto'
                />
              </Link>
            </div>
            <div className='text-gray-dark ml-auto flex items-center gap-4'>
              <Link href={ROUTES.HOME} className='hover:text-primary-hover transition-colors'>
                <FaRegUserCircle className='text-xl' />
              </Link>
              <button className='hover:text-primary-hover cursor-pointer transition-colors'>
                <FiBox className='text-xl' />
              </button>
              <button className='hover:text-primary-hover cursor-pointer transition-colors'>
                <HiOutlineSearch className='text-xl' />
              </button>

              {isLoading ? (
                <LoadingSpinner size='sm' />
              ) : user ? (
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <button className='hover:text-primary-hover flex cursor-pointer items-center gap-1 text-base text-gray-600 transition-colors'>
                      <span>{user.mb_nick} 님</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end' className='w-36 p-0'>
                    <DropdownMenuItem onClick={handleLogout} className='cursor-pointer'>
                      로그아웃
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href={ROUTES.LOGIN} className='hover:text-primary-hover transition-colors'>
                  로그인
                </Link>
              )}

              <button className='hover:text-primary-hover cursor-pointer transition-colors'>
                <HiOutlineMenu className='text-xl' />
              </button>
            </div>
          </div>
          <nav className='hidden sm:flex sm:items-center sm:justify-between'>
            <ul className='flex gap-5'>
              {NAV_MENU_ITEMS.map((item) => (
                <li key={item.href}>
                  {item.requiresAuth ? (
                    <button
                      onClick={(e) => handleAuthRequiredClick(e, item.href)}
                      className='text-gray-medium hover:text-primary-hover flex cursor-pointer items-center gap-1 text-lg font-semibold transition-colors'
                    >
                      {item.label}
                      <IoIosArrowDown className='text-sm' />
                    </button>
                  ) : (
                    <Link
                      href={item.href}
                      className='text-gray-medium hover:text-primary-hover flex items-center gap-1 text-lg font-semibold transition-colors'
                    >
                      {item.label}
                      <IoIosArrowDown className='text-sm' />
                    </Link>
                  )}
                </li>
              ))}
            </ul>
            <button
              onClick={(e) => handleAuthRequiredClick(e, ROUTES.MY_UDIGN)}
              className='text-gray-medium hover:text-primary-hover cursor-pointer text-lg font-semibold transition-colors'
            >
              My UDIGN
            </button>
          </nav>
        </div>
      </header>

      <LoginRequiredDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} />
    </>
  );
}
