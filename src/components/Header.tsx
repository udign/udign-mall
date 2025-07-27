'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { HiOutlineMenu } from 'react-icons/hi';
import { FiClock, FiSearch } from 'react-icons/fi';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/primitives/dropdown-menu';
import { ROUTES } from '@/lib/routes';
import { useAuth } from '@/contexts/AuthContext';
import LoginRequiredDialog from '@/components/LoginRequiredDialog';
import TodayViewedProductsSidebar from '@/components/TodayViewedProductsSidebar';
import SearchSidebar from '@/components/SearchSidebar';
import NavigationSidebar from '@/components/NavigationSidebar';
import { Button } from '@/components/ui/primitives/button';
import Link from 'next/link';

export default function Header() {
  const [hideHeader, setHideHeader] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isSearchSidebarOpen, setIsSearchSidebarOpen] = useState<boolean>(false);
  const [isNavigationSidebarOpen, setIsNavigationSidebarOpen] = useState<boolean>(false);
  const [showLoginDialog, setShowLoginDialog] = useState<boolean>(false);

  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, logout } = useAuth();

  useEffect(() => {
    setHideHeader(pathname.includes('/admin'));
  }, [pathname]);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        logout();
        console.log('로그아웃 되었습니다.');
        router.push(ROUTES.SHOP);
      }
    } catch (error) {
      console.error('로그아웃 오류:', error);
    }
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

  const handleTodayViewedClick = () => {
    setIsSidebarOpen(true);
  };

  const handleSearchClick = () => {
    setIsSearchSidebarOpen(true);
  };

  const handleNavigationClick = () => {
    setIsNavigationSidebarOpen(true);
  };

  return (
    !hideHeader && (
      <>
        <header className='sticky top-0 z-50 bg-[#0e1731]'>
          <div className='space-y-5 px-6 py-5 sm:px-10'>
            <div className='flex items-center gap-3'>
              <div className='non-login'>
                <Link href={ROUTES.HOME}>
                  <Image src='/images/udign-white.png' alt='logo' width={103} height={35} />
                </Link>
              </div>
              <div className='ml-auto flex flex-shrink-0 items-center gap-2'>
                <Button
                  onClick={handleTodayViewedClick}
                  size='icon'
                  variant='ghost'
                  className='hover:text-white hover:bg-white/10'
                >
                  <FiClock className='text-xl text-white' />
                </Button>
                <Button
                  onClick={handleSearchClick}
                  size='icon'
                  variant='ghost'
                  className='hover:text-white hover:bg-white/10'
                >
                  <FiSearch className='text-xl text-white' />
                </Button>
                {user && user.mb_level >= 2 && (
                  <Button
                    onClick={() => router.push(ROUTES.ADMIN)}
                    variant='ghost'
                    className='hover:text-white hover:bg-white/10 text-base text-white'
                  >
                    <span>관리자</span>
                  </Button>
                )}
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant='ghost'
                        className='hover:text-white hover:bg-white/10 text-base text-white'
                      >
                        <span>{user.mb_name}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end' className='w-48'>
                      <DropdownMenuItem
                        onClick={() => router.push(ROUTES.PROFILE_CONFIRM)}
                        className='cursor-pointer'
                      >
                        회원정보 수정
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleLogout} className='cursor-pointer'>
                        로그아웃
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    onClick={() => router.push(ROUTES.LOGIN)}
                    variant='ghost'
                    className='hover:text-white hover:bg-white/10 text-base text-white'
                  >
                    <span>로그인</span>
                  </Button>
                )}

                <Button
                  variant='ghost'
                  className='hover:text-white hover:bg-white/10'
                  onClick={handleNavigationClick}
                >
                  <HiOutlineMenu className='text-xl text-white' />
                </Button>
              </div>
            </div>
            {/* 데스크톱 네비게이션 메뉴 제거 */}
            {user && (
              <div className='flex justify-end -mt-4 -mb-4'>
                <Button
                  onClick={(e) => handleAuthRequiredClick(e, ROUTES.MY_UDIGN)}
                  variant='ghost'
                  className='text-white hover:text-white hover:bg-white/10 h-10 text-lg font-semibold'
                >
                  My UDIGN
                </Button>
              </div>
            )}
          </div>
        </header>

        <TodayViewedProductsSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <SearchSidebar
          isOpen={isSearchSidebarOpen}
          onClose={() => setIsSearchSidebarOpen(false)}
        />

        <NavigationSidebar
          isOpen={isNavigationSidebarOpen}
          onClose={() => setIsNavigationSidebarOpen(false)}
        />

        <LoginRequiredDialog
          open={showLoginDialog}
          onOpenChange={setShowLoginDialog}
          title='로그인이 필요합니다'
          description='이 기능을 사용하시려면 로그인이 필요합니다.'
        />
      </>
    )
  );
}
