import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { ROUTES } from '@/lib/routes';
import { PERMISSION_CHECKS } from '@/lib/constants';
import AdminLayoutClient from '@/components/AdminLayoutClient';

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const user = await getCurrentUser();

  // 관리자 권한 체크
  if (!user || !PERMISSION_CHECKS.isAdmin(user.mb_level)) {
    redirect(ROUTES.SHOP);
  }

  return <AdminLayoutClient user={user}>{children}</AdminLayoutClient>;
}
