'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  FileText,
  Settings,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

interface MenuItem {
  label: string;
  href: string;
  icon: ReactNode;
  children?: MenuItem[];
}

function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['상품관리']);
  const pathname = usePathname();

  const menuItems: MenuItem[] = [
    {
      label: '대시보드',
      href: '/admin',
      icon: <LayoutDashboard className='h-5 w-5' />,
    },
    {
      label: '상품관리',
      href: '/admin/products',
      icon: <ShoppingBag className='h-5 w-5' />,
      children: [
        { label: '상품 목록', href: '/admin/products', icon: <FileText className='h-4 w-4' /> },
        { label: '검수 관리', href: '/admin/review', icon: <FileText className='h-4 w-4' /> },
        {
          label: '카테고리 관리',
          href: '/admin/categories',
          icon: <FileText className='h-4 w-4' />,
        },
      ],
    },
    {
      label: '회원관리',
      href: '/admin/members',
      icon: <Users className='h-5 w-5' />,
    },
    {
      label: '주문관리',
      href: '/admin/orders',
      icon: <FileText className='h-5 w-5' />,
    },
    {
      label: '설정',
      href: '/admin/settings',
      icon: <Settings className='h-5 w-5' />,
    },
  ];

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label],
    );
  };

  const isActive = (href: string) => pathname === href;

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* 모바일 메뉴 버튼 */}
      <div className='fixed top-4 left-4 z-50 lg:hidden'>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className='rounded-md bg-white p-2 shadow-md'
        >
          {sidebarOpen ? <X className='h-6 w-6' /> : <Menu className='h-6 w-6' />}
        </button>
      </div>

      {/* 사이드바 */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-white shadow-lg transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div className='flex h-full flex-col'>
          {/* 로고 */}
          <div className='flex h-16 items-center justify-center bg-blue-600 px-4 text-white'>
            <h1 className='text-xl font-bold'>유다인 관리자</h1>
          </div>

          {/* 메뉴 */}
          <nav className='flex-1 space-y-2 px-4 py-6'>
            {menuItems.map((item) => (
              <div key={item.label}>
                {item.children ? (
                  <div>
                    <button
                      onClick={() => toggleMenu(item.label)}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        pathname.startsWith(item.href)
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      } `}
                    >
                      <div className='flex items-center space-x-3'>
                        {item.icon}
                        <span>{item.label}</span>
                      </div>
                      {expandedMenus.includes(item.label) ? (
                        <ChevronDown className='h-4 w-4' />
                      ) : (
                        <ChevronRight className='h-4 w-4' />
                      )}
                    </button>
                    {expandedMenus.includes(item.label) && (
                      <div className='mt-2 ml-4 space-y-1'>
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={`flex items-center space-x-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                              isActive(child.href)
                                ? 'bg-blue-100 font-medium text-blue-700'
                                : 'text-gray-600 hover:bg-gray-100'
                            } `}
                          >
                            {child.icon}
                            <span>{child.label}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className={`flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    } `}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                )}
              </div>
            ))}
          </nav>

          {/* 사용자 정보 */}
          <div className='border-t px-4 py-4'>
            <div className='flex items-center space-x-3'>
              <div className='flex h-8 w-8 items-center justify-center rounded-full bg-blue-600'>
                <span className='text-sm font-medium text-white'>관</span>
              </div>
              <div>
                <p className='text-sm font-medium text-gray-900'>관리자</p>
                <p className='text-xs text-gray-500'>admin@udign.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className='lg:ml-64'>
        <main className='p-6'>{children}</main>
      </div>

      {/* 모바일 오버레이 */}
      {sidebarOpen && (
        <div
          className='bg-opacity-50 fixed inset-0 z-30 bg-black lg:hidden'
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

export default AdminLayout;
