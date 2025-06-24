'use client';

import Link from 'next/link';
import Image from 'next/image';
import { HiOutlineSearch, HiOutlineMenu } from 'react-icons/hi';
import { FiBox } from 'react-icons/fi';
import { FaRegUserCircle } from 'react-icons/fa';
import { IoIosArrowDown } from 'react-icons/io';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const menuItems = [
  { href: '/fashion', label: 'fashion' },
  { href: '/shoes', label: 'shoes' },
  { href: '/others', label: 'others' },
  { href: '/upload', label: '디자인 업로드' },
];

export default function Header() {
  const { user, logout, isLoading } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className='sticky top-0 z-50 bg-white'>
      <div className='space-y-5 px-6 py-5 sm:px-10'>
        <div className='flex items-center gap-3'>
          <div className='non-login'>
            <Link href='/' className='flex items-center'>
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
            <Link href='/' className='hover:text-primary-hover transition-colors'>
              <FaRegUserCircle className='text-xl' />
            </Link>
            <button className='hover:text-primary-hover cursor-pointer transition-colors'>
              <FiBox className='text-xl' />
            </button>
            <button className='hover:text-primary-hover cursor-pointer transition-colors'>
              <HiOutlineSearch className='text-xl' />
            </button>

            {isLoading ? (
              <span className='text-gray-500'>로딩 중...</span>
            ) : user ? (
              <DropdownMenu>
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
              <Link href='/login' className='hover:text-primary-hover transition-colors'>
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
            {menuItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className='text-gray-medium hover:text-primary-hover flex items-center gap-1 text-lg font-semibold transition-colors'
                >
                  {item.label}
                  <IoIosArrowDown className='text-sm' />
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href='/'
            className='text-gray-medium hover:text-primary-hover text-lg font-semibold transition-colors'
          >
            My UDIGN
          </Link>
        </nav>
      </div>
    </header>
  );
}
