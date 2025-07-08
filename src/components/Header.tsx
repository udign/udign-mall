'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { HiOutlineSearch, HiOutlineMenu } from 'react-icons/hi';
import { FiBox } from 'react-icons/fi';
import { FaRegUserCircle } from 'react-icons/fa';
import { IoIosArrowDown } from 'react-icons/io';
import { useAuth } from '@/contexts/AuthContext';
import { useTodayViewedProducts } from '@/hooks/useTodayViewedProducts';
import { ROUTES } from '@/lib/routes';
import { NAV_MENU_ITEMS } from '@/lib/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/primitives/dropdown-menu';
import LoginRequiredDialog from '@/components/LoginRequiredDialog';
import LoadingSpinner from '@/components/states/LoadingSpinner';
import TodayViewedProductsSidebar from '@/components/TodayViewedProductsSidebar';
import SearchSidebar from '@/components/SearchSidebar';
import NavigationSidebar from '@/components/NavigationSidebar';
import { Button } from '@/components/ui/primitives/button';

export default function Header() {
  const [showLoginDialog, setShowLoginDialog] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isSearchSidebarOpen, setIsSearchSidebarOpen] = useState<boolean>(false);
  const [isNavigationSidebarOpen, setIsNavigationSidebarOpen] = useState<boolean>(false);

  const { user, logout, isLoading } = useAuth();
  const { count: viewedProductsCount } = useTodayViewedProducts();

  const router = useRouter();
  const pathname = usePathname();

  const hideHeader =
    pathname === ROUTES.LOGIN || pathname === ROUTES.REGISTER || pathname === ROUTES.TERMS;

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
        <header className='sticky top-0 z-50 bg-white'>
          <div className='space-y-5 px-6 py-5 sm:px-10'>
            <div className='flex items-center gap-3'>
              <div className='non-login'>
                <Button
                  onClick={() => router.push(ROUTES.SHOP)}
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
                <Button
                  variant='ghost'
                  className='hover:text-primary-hover relative'
                  onClick={handleTodayViewedClick}
                >
                  <FiBox className='text-xl' />
                  {viewedProductsCount > 0 && (
                    <span className='absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-xs text-white'>
                      {viewedProductsCount}
                    </span>
                  )}
                </Button>
                <Button
                  variant='ghost'
                  className='hover:text-primary-hover'
                  onClick={handleSearchClick}
                >
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
                      {user.mb_level >= 10 && (
                        <DropdownMenuItem
                          onClick={() => router.push(ROUTES.ADMIN)}
                          className='cursor-pointer'
                        >
                          관리자
                        </DropdownMenuItem>
                      )}
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

                <Button
                  variant='ghost'
                  className='hover:text-primary-hover sm:hidden'
                  onClick={handleNavigationClick}
                >
                  <HiOutlineMenu className='text-xl' />
                </Button>
              </div>
            </div>
            <nav className='hidden sm:flex sm:items-center sm:justify-between'>
              <ul className='flex items-center gap-1'>
                {NAV_MENU_ITEMS.map((item) => (
                  <li key={item.href} className='flex items-center'>
                    {item.subCategories ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant='ghost'
                            className='text-gray-medium hover:text-primary-hover flex h-10 items-center gap-1 text-lg font-semibold'
                          >
                            {item.label}
                            <IoIosArrowDown className='text-sm' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='start' className='w-32 p-0'>
                          <DropdownMenuItem
                            onClick={() => router.push(item.href)}
                            className='cursor-pointer'
                          >
                            전체
                          </DropdownMenuItem>
                          {item.subCategories.map((subCategory) =>
                            subCategory.thirdCategories ? (
                              <DropdownMenu key={subCategory.id}>
                                <DropdownMenuTrigger asChild>
                                  <DropdownMenuItem
                                    onSelect={(e) => e.preventDefault()}
                                    className='cursor-pointer justify-between'
                                  >
                                    {subCategory.label}
                                    <IoIosArrowDown className='rotate-[-90deg] text-sm' />
                                  </DropdownMenuItem>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  side='right'
                                  alignOffset={-5}
                                  className='w-32 p-0'
                                >
                                  <DropdownMenuItem
                                    onClick={() => router.push(subCategory.href)}
                                    className='cursor-pointer'
                                  >
                                    전체
                                  </DropdownMenuItem>
                                  {subCategory.thirdCategories.map((thirdCategory) => (
                                    <DropdownMenuItem
                                      key={thirdCategory.id}
                                      onClick={() => router.push(thirdCategory.href)}
                                      className='cursor-pointer'
                                    >
                                      {thirdCategory.label}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            ) : (
                              <DropdownMenuItem
                                key={subCategory.id}
                                onClick={() => router.push(subCategory.href)}
                                className='cursor-pointer'
                              >
                                {subCategory.label}
                              </DropdownMenuItem>
                            ),
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : item.requiresAuth ? (
                      <Button
                        onClick={(e) => handleAuthRequiredClick(e, item.href)}
                        variant='ghost'
                        className='text-gray-medium hover:text-primary-hover flex h-10 items-center gap-1 text-lg font-semibold'
                      >
                        {item.label}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => router.push(item.href)}
                        variant='ghost'
                        className='text-gray-medium hover:text-primary-hover flex h-10 items-center gap-1 text-lg font-semibold'
                      >
                        {item.label}
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
        <TodayViewedProductsSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        <SearchSidebar isOpen={isSearchSidebarOpen} onClose={() => setIsSearchSidebarOpen(false)} />
        <NavigationSidebar
          isOpen={isNavigationSidebarOpen}
          onClose={() => setIsNavigationSidebarOpen(false)}
        />
      </>
    )
  );
}
