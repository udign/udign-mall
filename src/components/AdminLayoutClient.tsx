'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  ChevronDown,
  ChevronRight,
  Store,
  LogOut,
  Users,
  TrendingUp,
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/primitives/sidebar';
import { Button } from '@/components/ui/primitives/button';
import { ROUTES } from '@/lib/routes';
import { User } from '@/types/user';

interface AdminLayoutClientProps {
  children: ReactNode;
  user: User;
}

interface MenuItem {
  label: string;
  href: string;
  icon: ReactNode;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    label: '대시보드',
    href: ROUTES.ADMIN,
    icon: <LayoutDashboard className='h-4 w-4' />,
  },
  {
    label: '회원 관리',
    href: ROUTES.ADMIN_MEMBER,
    icon: <Users className='h-4 w-4' />,
  },
  {
    label: '작품관리',
    href: ROUTES.ADMIN_REVIEW,
    icon: <ShoppingBag className='h-4 w-4' />,
  },
  {
    label: '매출현황',
    href: ROUTES.ADMIN_SALES,
    icon: <TrendingUp className='h-4 w-4' />,
  },
];

export default function AdminLayoutClient({ children, user }: AdminLayoutClientProps) {
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  const router = useRouter();
  const pathname = usePathname();

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label],
    );
  };

  const isActive = (href: string) => pathname === href;

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
                {item.children ? (
                  <>
                    <SidebarMenuButton
                      onClick={() => toggleMenu(item.label)}
                      isActive={pathname.startsWith(item.href)}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                      {expandedMenus.includes(item.label) ? (
                        <ChevronDown className='ml-auto h-4 w-4' />
                      ) : (
                        <ChevronRight className='ml-auto h-4 w-4' />
                      )}
                    </SidebarMenuButton>
                    {expandedMenus.includes(item.label) && (
                      <SidebarMenuSub>
                        {item.children.map((child) => (
                          <SidebarMenuSubItem key={child.href}>
                            <SidebarMenuSubButton asChild isActive={isActive(child.href)}>
                              <Link href={child.href}>
                                {child.icon}
                                <span>{child.label}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    )}
                  </>
                ) : (
                  <SidebarMenuButton className='h-10' asChild isActive={isActive(item.href)}>
                    <Link href={item.href}>
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
