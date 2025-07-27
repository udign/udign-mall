import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
}

export const YouTubeIcon: React.FC<IconProps> = ({ size = 24, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      className={className}
    >
      <path
        d='M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z'
        fill='#FFFFFF'
      />
    </svg>
  );
};

export const InstagramIcon: React.FC<IconProps> = ({ size = 24, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      className={className}
    >
      <path
        d='M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z'
        fill='#FFFFFF'
      />
    </svg>
  );
};

export const KakaoTalkIcon: React.FC<IconProps> = ({ size = 24, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      className={className}
    >
      {/* 말풍선 몸체 */}
      <ellipse cx='12' cy='10' rx='9' ry='6.5' fill='#FFFFFF' />
      {/* 말풍선 꼬리 */}
      <path d='M9 16 L7 20 L11 16.5 Z' fill='#FFFFFF' />
    </svg>
  );
};

export const GmailIcon: React.FC<IconProps> = ({ size = 24, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      className={className}
    >
      <path
        d='M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z'
        fill='#FFFFFF'
      />
    </svg>
  );
};

// 소셜 아이콘 컴포넌트
const SocialIcons: React.FC = () => {
  return (
    <div className='flex space-x-4'>
      <a
        href='https://youtube.com/@udign?si=qfjEDralJY9zD_O9'
        target='_blank'
        rel='noopener noreferrer'
        className='rounded-full bg-white/10 p-2 transition-all hover:bg-white/20'
        aria-label='YouTube'
      >
        <YouTubeIcon size={20} />
      </a>
      <a
        href='https://www.instagram.com/udign.official?igsh=MXA2OHY2OWs0NjlnZw%3D%3D&utm_source=qr'
        target='_blank'
        rel='noopener noreferrer'
        className='rounded-full bg-white/10 p-2 transition-all hover:bg-white/20'
        aria-label='Instagram'
      >
        <InstagramIcon size={20} />
      </a>
      <a
        href='http://pf.kakao.com/_wxatbn'
        target='_blank'
        rel='noopener noreferrer'
        className='rounded-full bg-white/10 p-2 transition-all hover:bg-white/20'
        aria-label='KakaoTalk'
      >
        <KakaoTalkIcon size={20} />
      </a>
      <a
        href='mailto:udign0401@gmail.com'
        className='rounded-full bg-white/10 p-2 transition-all hover:bg-white/20'
        aria-label='Email'
      >
        <GmailIcon size={20} />
      </a>
    </div>
  );
};

export default SocialIcons;
