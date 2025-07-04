'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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

interface ThirdCategory {
  id: string;
  label: string;
  href: string;
}

interface SubCategory {
  id: string;
  label: string;
  href: string;
  thirdCategories?: ThirdCategory[];
}

interface NavMenuItem {
  href: string;
  label: string;
  requiresAuth?: boolean;
  subCategories?: SubCategory[];
}

const NAV_MENU_ITEMS: NavMenuItem[] = [
  {
    href: ROUTES.FASHION,
    label: 'fashion',
    subCategories: [
      {
        id: '1010',
        label: 'men',
        href: `${ROUTES.FASHION}?subcategory=1010`,
        thirdCategories: [
          {
            id: '101010',
            label: 'top',
            href: `${ROUTES.FASHION}?subcategory=1010&thirdcategory=101010`,
          },
          {
            id: '101020',
            label: 'bottom',
            href: `${ROUTES.FASHION}?subcategory=1010&thirdcategory=101020`,
          },
          {
            id: '101030',
            label: 'outer',
            href: `${ROUTES.FASHION}?subcategory=1010&thirdcategory=101030`,
          },
          {
            id: '101040',
            label: 'product',
            href: `${ROUTES.FASHION}?subcategory=1010&thirdcategory=101040`,
          },
          {
            id: '101050',
            label: 'space',
            href: `${ROUTES.FASHION}?subcategory=1010&thirdcategory=101050`,
          },
        ],
      },
      {
        id: '1020',
        label: 'women',
        href: `${ROUTES.FASHION}?subcategory=1020`,
        thirdCategories: [
          {
            id: '102010',
            label: 'top',
            href: `${ROUTES.FASHION}?subcategory=1020&thirdcategory=102010`,
          },
          {
            id: '102020',
            label: 'bottom',
            href: `${ROUTES.FASHION}?subcategory=1020&thirdcategory=102020`,
          },
          {
            id: '102030',
            label: 'outer',
            href: `${ROUTES.FASHION}?subcategory=1020&thirdcategory=102030`,
          },
          {
            id: '102040',
            label: 'product',
            href: `${ROUTES.FASHION}?subcategory=1020&thirdcategory=102040`,
          },
          {
            id: '102050',
            label: 'space',
            href: `${ROUTES.FASHION}?subcategory=1020&thirdcategory=102050`,
          },
        ],
      },
    ],
  },
  {
    href: ROUTES.SHOES,
    label: 'shoes',
    subCategories: [
      {
        id: '2010',
        label: 'men',
        href: `${ROUTES.SHOES}?subcategory=2010`,
        thirdCategories: [
          {
            id: '201010',
            label: '운동화',
            href: `${ROUTES.SHOES}?subcategory=2010&thirdcategory=201010`,
          },
          {
            id: '201020',
            label: '구두/스니커즈',
            href: `${ROUTES.SHOES}?subcategory=2010&thirdcategory=201020`,
          },
          {
            id: '201030',
            label: '워커',
            href: `${ROUTES.SHOES}?subcategory=2010&thirdcategory=201030`,
          },
          {
            id: '201040',
            label: '샌들/슬리퍼',
            href: `${ROUTES.SHOES}?subcategory=2010&thirdcategory=201040`,
          },
          {
            id: '201050',
            label: '레인부츠',
            href: `${ROUTES.SHOES}?subcategory=2010&thirdcategory=201050`,
          },
        ],
      },
      {
        id: '2020',
        label: 'women',
        href: `${ROUTES.SHOES}?subcategory=2020`,
        thirdCategories: [
          {
            id: '202010',
            label: '운동화',
            href: `${ROUTES.SHOES}?subcategory=2020&thirdcategory=202010`,
          },
          {
            id: '202020',
            label: '구두/스니커즈',
            href: `${ROUTES.SHOES}?subcategory=2020&thirdcategory=202020`,
          },
          {
            id: '202030',
            label: '샌들/슬리퍼',
            href: `${ROUTES.SHOES}?subcategory=2020&thirdcategory=202030`,
          },
          {
            id: '202040',
            label: '부츠',
            href: `${ROUTES.SHOES}?subcategory=2020&thirdcategory=202040`,
          },
          {
            id: '202050',
            label: '레인부츠',
            href: `${ROUTES.SHOES}?subcategory=2020&thirdcategory=202050`,
          },
        ],
      },
    ],
  },
  {
    href: ROUTES.OTHERS,
    label: 'others',
    subCategories: [
      {
        id: '3010',
        label: 'men',
        href: `${ROUTES.OTHERS}?subcategory=3010`,
        thirdCategories: [
          {
            id: '301010',
            label: '상의',
            href: `${ROUTES.OTHERS}?subcategory=3010&thirdcategory=301010`,
          },
          {
            id: '301020',
            label: '하의',
            href: `${ROUTES.OTHERS}?subcategory=3010&thirdcategory=301020`,
          },
          {
            id: '301030',
            label: 'graphic',
            href: `${ROUTES.OTHERS}?subcategory=3010&thirdcategory=301030`,
          },
          {
            id: '301040',
            label: 'product',
            href: `${ROUTES.OTHERS}?subcategory=3010&thirdcategory=301040`,
          },
          {
            id: '301050',
            label: 'space',
            href: `${ROUTES.OTHERS}?subcategory=3010&thirdcategory=301050`,
          },
        ],
      },
      {
        id: '3020',
        label: 'women',
        href: `${ROUTES.OTHERS}?subcategory=3020`,
        thirdCategories: [
          {
            id: '302010',
            label: '상의',
            href: `${ROUTES.OTHERS}?subcategory=3020&thirdcategory=302010`,
          },
          {
            id: '302020',
            label: '하의',
            href: `${ROUTES.OTHERS}?subcategory=3020&thirdcategory=302020`,
          },
          {
            id: '302030',
            label: 'graphic',
            href: `${ROUTES.OTHERS}?subcategory=3020&thirdcategory=302030`,
          },
          {
            id: '302040',
            label: 'product',
            href: `${ROUTES.OTHERS}?subcategory=3020&thirdcategory=302040`,
          },
          {
            id: '302050',
            label: 'space',
            href: `${ROUTES.OTHERS}?subcategory=3020&thirdcategory=302050`,
          },
        ],
      },
    ],
  },
  { href: ROUTES.UPLOAD, label: '디자인 업로드', requiresAuth: true },
];

export default function Header() {
  const [showLoginDialog, setShowLoginDialog] = useState<boolean>(false);

  const { user, logout, isLoading } = useAuth();

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

  return (
    !hideHeader && (
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

                <Button variant='ghost' className='hover:text-primary-hover'>
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
    )
  );
}
