'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, ShoppingBag, ChevronDown, ChevronRight } from 'lucide-react';
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
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/lib/routes';

interface AdminLayoutProps {
  children: ReactNode;
}

interface MenuItem {
  label: string;
  href: string;
  icon: ReactNode;
  children?: MenuItem[];
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  const router = useRouter();
  const pathname = usePathname();

  const { user, isLoading } = useAuth();

  // 관리자 권한 체크 (레벨 10 이상을 관리자로 가정)
  useEffect(() => {
    if (!isLoading && (!user || user.mb_level < 10)) {
      alert('관리자 권한이 필요합니다.');
      router.push('/');
    }
  }, [user, isLoading, router]);

  const menuItems: MenuItem[] = [
    {
      label: '대시보드',
      href: ROUTES.ADMIN,
      icon: <LayoutDashboard className='h-4 w-4' />,
    },
    {
      label: '작품관리',
      href: ROUTES.ADMIN_REVIEW,
      icon: <ShoppingBag className='h-4 w-4' />,
    },
  ];

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label],
    );
  };

  const isActive = (href: string) => pathname === href;

  return (
    <SidebarProvider>
      <Sidebar variant='sidebar'>
        <SidebarHeader>
          <div className='bg-primary flex items-center justify-center rounded-lg py-4 text-white'>
            <h1 className='text-lg font-bold'>유다인 관리자</h1>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarMenu>
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
                  <SidebarMenuButton asChild isActive={isActive(item.href)}>
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
        <header className='flex h-16 shrink-0 items-center gap-2 border-b px-4'>
          <SidebarTrigger className='-ml-1' />
          <div className='bg-border h-4 w-px' />
          <h1 className='text-lg font-semibold'>유다인 관리자 페이지</h1>
        </header>

        <main className='flex-1 space-y-4 p-4 md:p-6'>{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
