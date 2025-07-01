'use client';

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
} from '@/components/ui/primitives/dropdown-menu';
import LoginRequiredDialog from '@/components/LoginRequiredDialog';
import LoadingSpinner from '@/components/states/LoadingSpinner';
import { Button } from '@/components/ui/primitives/button';

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
              <Button
                onClick={() => router.push(ROUTES.HOME)}
                variant='ghost'
                className='flex h-auto items-center p-0 hover:bg-transparent'
              >
                <Image
                  src='/images/udign-header.png'
                  alt='UDIGN'
                  width={100}
                  height={40}
                  className='h-auto'
                />
              </Button>
            </div>
            <div className='text-gray-dark ml-auto flex items-center gap-1'>
              <Button
                onClick={(e) => handleAuthRequiredClick(e, ROUTES.MY_UDIGN)}
                variant='ghost'
                className='hover:text-primary-hover'
              >
                <FaRegUserCircle className='text-xl' />
              </Button>
              <Button variant='ghost' className='hover:text-primary-hover'>
                <FiBox className='text-xl' />
              </Button>
              <Button variant='ghost' className='hover:text-primary-hover'>
                <HiOutlineSearch className='text-xl' />
              </Button>

              {isLoading ? (
                <LoadingSpinner size='sm' />
              ) : user ? (
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant='ghost'
                      className='hover:text-primary-hover text-base text-gray-600'
                    >
                      <span>{user.mb_nick} 님</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end' className='w-36 p-0'>
                    <DropdownMenuItem onClick={handleLogout} className='cursor-pointer'>
                      로그아웃
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  onClick={() => router.push(ROUTES.LOGIN)}
                  variant='ghost'
                  className='hover:text-primary-hover text-base text-gray-600'
                >
                  <span>로그인</span>
                </Button>
              )}

              <Button variant='ghost' className='hover:text-primary-hover'>
                <HiOutlineMenu className='text-xl' />
              </Button>
            </div>
          </div>
          <nav className='hidden sm:flex sm:items-center sm:justify-between'>
            <ul className='flex items-center gap-1'>
              {NAV_MENU_ITEMS.map((item) => (
                <li key={item.href} className='flex items-center'>
                  {item.requiresAuth ? (
                    <Button
                      onClick={(e) => handleAuthRequiredClick(e, item.href)}
                      variant='ghost'
                      className='text-gray-medium hover:text-primary-hover flex h-10 items-center gap-1 text-lg font-semibold'
                    >
                      {item.label}
                      <IoIosArrowDown className='text-sm' />
                    </Button>
                  ) : (
                    <Button
                      onClick={() => router.push(item.href)}
                      variant='ghost'
                      className='text-gray-medium hover:text-primary-hover flex h-10 items-center gap-1 text-lg font-semibold'
                    >
                      {item.label}
                      <IoIosArrowDown className='text-sm' />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
            <Button
              onClick={(e) => handleAuthRequiredClick(e, ROUTES.MY_UDIGN)}
              variant='ghost'
              className='text-gray-medium hover:text-primary-hover h-10 text-lg font-semibold'
            >
              My UDIGN
            </Button>
          </nav>
        </div>
      </header>

      <LoginRequiredDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} />
    </>
  );
}
