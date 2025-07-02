import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { ROUTES } from '@/lib/routes';
import AdminLayoutClient from '@/components/AdminLayoutClient';

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  // 서버에서 현재 사용자 정보 가져오기
  const user = await getCurrentUser();

  // 관리자 권한 체크 (레벨 10 이상을 관리자로 가정)
  if (!user || user.mb_level < 10) {
    redirect(ROUTES.SHOP);
  }

  return <AdminLayoutClient user={user}>{children}</AdminLayoutClient>;
}
