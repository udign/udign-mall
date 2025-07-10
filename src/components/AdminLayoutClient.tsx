'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  Store,
  BarChart3,
  LogOut,
  Users,
  TrendingUp,
  Palette,
  UserCheck,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/primitives/sidebar';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/primitives/accordion';
import { Button } from '@/components/ui/primitives/button';
import { ROUTES } from '@/lib/routes';
import { User } from '@/types/user';

interface AdminLayoutClientProps {
  children: ReactNode;
  user: User;
}

interface MenuItem {
  label: string;
  href?: string;
  icon: ReactNode;
  subMenus?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    label: '대시보드',
    href: ROUTES.ADMIN,
    icon: <LayoutDashboard className='h-4 w-4' />,
  },
  {
    label: '사용자 관리',
    icon: <Users className='h-4 w-4' />,
    subMenus: [
      {
        label: '회원 관리',
        href: ROUTES.ADMIN_MEMBER,
        icon: <UserCheck className='h-4 w-4' />,
      },
    ],
  },
  {
    label: '쇼핑몰 관리',
    icon: <ShoppingBag className='h-4 w-4' />,
    subMenus: [
      {
        label: '작품관리',
        href: ROUTES.ADMIN_REVIEW,
        icon: <Palette className='h-4 w-4' />,
      },
    ],
  },
  {
    label: '쇼핑몰 현황/기타',
    icon: <BarChart3 className='h-4 w-4' />,
    subMenus: [
      {
        label: '매출현황',
        href: ROUTES.ADMIN_SALES,
        icon: <TrendingUp className='h-4 w-4' />,
      },
      {
        label: '상품판매순위',
        href: ROUTES.ADMIN_SALES_RANKING,
        icon: <TrendingUp className='h-4 w-4' />,
      },
    ],
  },
];

export default function AdminLayoutClient({ children, user }: AdminLayoutClientProps) {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href;

  const isParentActive = (item: MenuItem) => {
    if (item.href) return isActive(item.href);
    return item.subMenus?.some((subMenu) => subMenu.href && isActive(subMenu.href)) || false;
  };

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        window.location.replace(ROUTES.SHOP);
      }
    } catch (error) {
      console.error('로그아웃 실패:', error);
      alert('로그아웃 중 오류가 발생했습니다.');
    }
  };

  return (
    <SidebarProvider>
      <Sidebar variant='sidebar'>
        <SidebarHeader>
          <div className='bg-primary flex items-center justify-center rounded-lg py-4 text-white'>
            <h1 className='text-lg font-bold'>유다인 관리자</h1>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarMenu className='px-2'>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.label}>
                {item.subMenus ? (
                  <div className='mb-2'>
                    <Accordion type='multiple' className='w-full'>
                      <AccordionItem value={item.label} className='border-0'>
                        <AccordionTrigger
                          className={`hover:text-primary-hover rounded-md px-2 py-3 text-sm font-medium hover:no-underline ${
                            isParentActive(item)
                              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                              : 'text-sidebar-foreground'
                          }`}
                        >
                          <div className='flex items-center gap-2'>
                            {item.icon}
                            <span>{item.label}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className='pb-0'>
                          <div className='space-y-1'>
                            {item.subMenus.map((subMenu) => (
                              <Button
                                key={subMenu.label}
                                variant='ghost'
                                className={`hover:bg-sidebar-accent hover:text-sidebar-accent-foreground h-9 w-full justify-start pl-8 text-left text-sm font-medium ${
                                  subMenu.href && isActive(subMenu.href)
                                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                    : 'text-sidebar-foreground'
                                }`}
                                onClick={() => subMenu.href && handleNavigation(subMenu.href)}
                              >
                                <div className='flex items-center gap-2'>
                                  {subMenu.icon}
                                  <span>{subMenu.label}</span>
                                </div>
                              </Button>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                ) : (
                  <SidebarMenuButton
                    className='h-10'
                    asChild
                    isActive={item.href ? isActive(item.href) : false}
                  >
                    <Link href={item.href!}>
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter>
          <div className='flex items-center space-x-3 p-2'>
            <div className='bg-primary flex h-8 w-8 items-center justify-center rounded-full'>
              <span className='text-sm font-medium text-white'>
                {user?.mb_name?.charAt(0) || user?.mb_nick?.charAt(0) || '관'}
              </span>
            </div>
            <div className='min-w-0 flex-1'>
              <p className='truncate text-sm font-medium'>
                {user?.mb_name || user?.mb_nick || '관리자'}
              </p>
              <p className='text-muted-foreground truncate text-xs'>
                {user?.mb_email || '이메일 정보 없음'}
              </p>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className='flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4'>
          <div className='flex items-center gap-2'>
            <SidebarTrigger className='-ml-1' />
            <div className='bg-border h-4 w-px' />
            <h1 className='text-lg font-semibold'>유다인 관리자 페이지</h1>
          </div>

          <div className='flex items-center gap-2'>
            <Button
              onClick={() => router.push(ROUTES.SHOP)}
              variant='ghost'
              size='sm'
              className='flex items-center gap-2'
              title='쇼핑몰로 이동'
              aria-label='쇼핑몰로 이동'
            >
              <Store className='h-4 w-4' />
              <span className='hidden md:inline'>쇼핑몰로 이동</span>
            </Button>

            <Button
              onClick={handleLogout}
              variant='ghost'
              size='sm'
              className='flex items-center gap-2'
              title='로그아웃'
              aria-label='로그아웃'
            >
              <LogOut className='h-4 w-4' />
              <span className='hidden md:inline'>로그아웃</span>
            </Button>
          </div>
        </header>

        <main className='flex-1 space-y-4 p-4 md:p-6'>{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
