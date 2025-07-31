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
import { MEMBER_LEVELS } from '@/lib/constants';
import { Dictionary } from '@/lib/dictionaries';
import Link from 'next/link';

interface HeaderProps {
  dictionary: Dictionary;
  transparent?: boolean;
}

export default function Header({ dictionary, transparent = false }: HeaderProps) {
  const [hideHeader, setHideHeader] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  const [isNavigationSidebarOpen, setIsNavigationSidebarOpen] = useState<boolean>(false);
  const [showLoginDialog, setShowLoginDialog] = useState<boolean>(false);
  const [purchaseCount, setPurchaseCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchSidebarOpen, setIsSearchSidebarOpen] = useState<boolean>(false);
  const [showPurchaseNotification, setShowPurchaseNotification] = useState<boolean>(false);
  const [hasSeenNotification, setHasSeenNotification] = useState<boolean>(false);

  const router = useRouter();
  const pathname = usePathname();

  const { user, isLoading, logout } = useAuth();

  useEffect(() => {
    setHideHeader(pathname.includes('/admin'));
  }, [pathname]);

  // 사용자가 변경될 때 알림 상태 초기화 (로그인/로그아웃 시)
  useEffect(() => {
    if (!isLoading) {
      setHasSeenNotification(false);
      setShowPurchaseNotification(false);
    }
  }, [user?.mb_no, isLoading]);

  // shop 메인 페이지에서 투명 헤더 적용
  const isShopMainPage = pathname.match(/^\/[a-z]{2}\/shop\/?$/);
  const shouldBeTransparent = transparent || isShopMainPage;

  // 구매가능한 상품 수 조회
  useEffect(() => {
    const fetchPurchaseCount = async () => {
      if (!user || isLoading) return;

      try {
        const response = await fetch('/api/my-udign/purchase-count', {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          const newCount = data.data?.count || 0;
          setPurchaseCount(newCount);

          // 구매 가능한 상품이 있고 아직 확인하지 않았으면 알림 표시
          if (newCount > 0 && !hasSeenNotification) {
            setShowPurchaseNotification(true);
          } else {
            setShowPurchaseNotification(false);
          }
        }
      } catch (error) {
        console.error('구매가능 상품 수 조회 오류:', error);
      }
    };

    fetchPurchaseCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isLoading]);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        logout();
        // 로그아웃 시 알림 확인 상태 초기화
        setHasSeenNotification(false);
        setShowPurchaseNotification(false);
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`${ROUTES.SEARCH}?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchSubmit(e);
    }
  };

  const handlePurchaseNotificationClick = () => {
    // 알림을 확인했다고 표시하고 숨김 처리
    setHasSeenNotification(true);
    setShowPurchaseNotification(false);
    router.push(ROUTES.MY_UDIGN);
  };

  return (
    !hideHeader && (
      <>
        <header
          className={`${shouldBeTransparent ? 'absolute' : 'sticky'} top-0 z-50 ${shouldBeTransparent ? 'right-0 left-0' : '-ml-[calc(50vw-50%)]'} w-screen ${shouldBeTransparent ? 'bg-white/10' : 'bg-[#0e1731]'}`}
        >
          <div className='space-y-5 px-6 py-5 sm:px-10'>
            <div className='flex items-center gap-3'>
              <div className='non-login'>
                <Link href={ROUTES.HOME}>
                  <Image src='/images/udign-white.png' alt='logo' width={103} height={35} />
                </Link>
              </div>

              {/* 검색바 - 데스크톱만 표시 */}
              <div className='ml-6 hidden max-w-md flex-1 sm:block'>
                <form onSubmit={handleSearchSubmit} className='relative'>
                  <input
                    type='text'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    placeholder='검색어를 입력하세요'
                    className='w-full rounded-full border border-white/20 bg-white/10 px-4 py-2 text-white placeholder:text-white/60 focus:border-white/40 focus:ring-2 focus:ring-white/20 focus:outline-none'
                  />
                  <button
                    type='submit'
                    className='absolute top-1/2 right-3 -translate-y-1/2 text-white/60 hover:text-white'
                  >
                    <FiSearch className='text-lg' />
                  </button>
                </form>
              </div>

              <div className='ml-auto flex flex-shrink-0 items-center gap-2'>
                {/* 구매 가능한 디자인 개수 알림 */}
                {user && showPurchaseNotification && purchaseCount > 0 && (
                  <Button
                    onClick={handlePurchaseNotificationClick}
                    className='flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-white shadow-lg hover:from-purple-600 hover:to-pink-600'
                  >
                    <div className='h-2 w-2 animate-pulse rounded-full bg-yellow-300'></div>
                    <span className='text-sm font-bold'>{purchaseCount}</span>
                    <span className='text-sm'>구매가능</span>
                  </Button>
                )}

                <Button
                  onClick={handleTodayViewedClick}
                  size='icon'
                  variant='ghost'
                  className='hover:bg-white/10 hover:text-white'
                >
                  <FiClock className='text-xl text-white' />
                </Button>
                {/* 검색 버튼 - 모바일만 표시 */}
                <Button
                  onClick={handleSearchClick}
                  size='icon'
                  variant='ghost'
                  className='flex items-center justify-center hover:bg-white/10 hover:text-white sm:hidden'
                >
                  <FiSearch className='text-xl text-white' />
                </Button>
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant='ghost'
                        className='text-base text-white hover:bg-white/10 hover:text-white'
                      >
                        <span>{user.mb_name}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end' className='w-32'>
                      {user.mb_level >= MEMBER_LEVELS.ADMIN && (
                        <DropdownMenuItem
                          onClick={() => router.push(ROUTES.ADMIN)}
                          className='cursor-pointer'
                        >
                          {dictionary.header.admin}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => router.push(ROUTES.PROFILE_CONFIRM)}
                        className='cursor-pointer'
                      >
                        {dictionary.header.editProfile}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleLogout} className='cursor-pointer'>
                        {dictionary.common.logout}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    onClick={() => router.push(ROUTES.LOGIN)}
                    variant='ghost'
                    className='text-base text-white hover:bg-white/10 hover:text-white'
                  >
                    <span>{dictionary.common.login}</span>
                  </Button>
                )}

                {/* My UDIGN 버튼 */}
                {user && (
                  <Button
                    onClick={(e) => handleAuthRequiredClick(e, ROUTES.MY_UDIGN)}
                    variant='ghost'
                    className='text-base font-semibold text-white hover:bg-white/10 hover:text-white'
                  >
                    My UDIGN
                  </Button>
                )}

                <Button
                  variant='ghost'
                  className='hover:bg-white/10 hover:text-white'
                  onClick={handleNavigationClick}
                >
                  <HiOutlineMenu className='text-xl text-white' />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <TodayViewedProductsSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          dictionary={dictionary}
        />

        <SearchSidebar
          isOpen={isSearchSidebarOpen}
          onClose={() => setIsSearchSidebarOpen(false)}
          dictionary={dictionary}
        />

        <NavigationSidebar
          isOpen={isNavigationSidebarOpen}
          onClose={() => setIsNavigationSidebarOpen(false)}
          dictionary={dictionary}
        />

        <LoginRequiredDialog
          open={showLoginDialog}
          onOpenChange={setShowLoginDialog}
          title={dictionary.header.loginRequired}
          description={dictionary.header.loginRequiredDesc}
        />
      </>
    )
  );
}
