import Link from 'next/link';
import Image from 'next/image';
import { HiOutlineSearch, HiOutlineMenu } from 'react-icons/hi';
import { FiBox } from 'react-icons/fi';
import { FaRegUserCircle } from 'react-icons/fa';
import { IoIosArrowDown } from 'react-icons/io';

const menuItems = [
  { href: '/fashion', label: 'fashion' },
  { href: '/shoes', label: 'shoes' },
  { href: '/others', label: 'others' },
  { href: '/upload', label: '디자인 업로드' },
];

export default function Header() {
  return (
    <header className='sticky top-0 z-50 border-b bg-white'>
      <div className='space-y-5 px-4 py-5'>
        <div className='flex items-center gap-3'>
          <div className='non-login'>
            <Link href='/' className='flex items-center'>
              <Image
                src='/images/Udign.png'
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
            <Link href='/' className='hover:text-primary-hover transition-colors'>
              로그인
            </Link>
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
