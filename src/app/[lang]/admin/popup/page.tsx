'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/lib/routes';
import { PERMISSION_CHECKS } from '@/lib/constants';
import { PopupListResponse, PopupListItem, POPUP_DEVICE_LABELS } from '@/types/popup';
import LoadingSpinner from '@/components/states/LoadingSpinner';
import CommonPagination from '@/components/CommonPagination';
import { Button } from '@/components/ui/primitives/button';
import MessageDialog from '@/components/ui/MessageDialog';
import { PAGINATION_CONFIG } from '@/lib/constants';
import { formatDate, truncateText } from '@/lib/utils';

const tableHeaders = [
  'ID',
  '제목',
  '접속기기',
  '시작일시',
  '종료일시',
  '비활성화 시간',
  '위치(L,T)',
  '크기(W,H)',
  '상태',
  '관리',
];

export default function PopupListPage() {
  const [data, setData] = useState<PopupListResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [dialogTitle, setDialogTitle] = useState<string>('');
  const [dialogMessage, setDialogMessage] = useState<string>('');
  const [dialogConfirm, setDialogConfirm] = useState<(() => void) | undefined>(undefined);

  const router = useRouter();
  const searchParams = useSearchParams();

  const { user, isLoading: authLoading } = useAuth();

  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push(ROUTES.LOGIN);
      return;
    }

    if (!PERMISSION_CHECKS.isAdmin(user.mb_level)) {
      router.push(ROUTES.SHOP);
      return;
    }
  }, [user, authLoading, router]);

  const fetchData = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/admin/popups?page=${page}&limit=${PAGINATION_CONFIG.ITEMS_PER_PAGE}`,
      );

      if (!response.ok) {
        throw new Error('데이터를 불러오는데 실패했습니다.');
      }

      const result: PopupListResponse = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      console.error('팝업 목록 조회 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!searchParams.get('page')) {
      const params = new URLSearchParams();
      params.set('page', searchParams.get('page') || '1');
      router.replace(`${ROUTES.ADMIN_POPUP}?${params.toString()}`);
    } else if (user && PERMISSION_CHECKS.isAdmin(user.mb_level)) {
      fetchData(currentPage);
    }
  }, [currentPage, user, searchParams, router]);

  const showDialog = (title: string, message: string, onConfirm?: () => void) => {
    setDialogTitle(title);
    setDialogMessage(message);
    setDialogConfirm(() => onConfirm);
    setDialogOpen(true);
  };

  const handleEdit = (popupId: number) => {
    router.push(`${ROUTES.ADMIN_POPUP_EDIT}/${popupId}`);
  };

  const performDelete = async (popupId: number) => {
    try {
      const response = await fetch(`/api/admin/popups/${popupId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('삭제에 실패했습니다.');
      }

      showDialog('성공', '팝업이 삭제되었습니다.', () => {
        fetchData(currentPage);
      });
    } catch (err) {
      showDialog('오류', err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = (popupId: number, popupTitle: string) => {
    showDialog('삭제 확인', `'${popupTitle}' 팝업을 삭제하시겠습니까?`, () =>
      performDelete(popupId),
    );
  };

  return authLoading ? (
    <div className='flex min-h-screen items-center justify-center'>
      <LoadingSpinner size='lg' message='권한을 확인하는 중...' />
    </div>
  ) : !user || !PERMISSION_CHECKS.isAdmin(user.mb_level) ? (
    <div className='flex min-h-screen items-center justify-center'>
      <div className='text-center'>
        <p className='mb-4 text-red-600'>관리자 권한이 필요합니다.</p>
        <Button onClick={() => router.push(ROUTES.LOGIN)}>로그인하기</Button>
      </div>
    </div>
  ) : loading ? (
    <div className='flex min-h-screen items-center justify-center'>
      <LoadingSpinner size='lg' message='팝업 목록을 불러오는 중...' />
    </div>
  ) : error ? (
    <div className='flex min-h-96 items-center justify-center'>
      <div className='text-center'>
        <p className='mb-4 text-red-600'>{error}</p>
        <Button onClick={() => fetchData(currentPage)}>다시 시도</Button>
      </div>
    </div>
  ) : !data ? (
    <div className='flex min-h-96 items-center justify-center'>
      <p className='text-gray-500'>데이터를 불러올 수 없습니다.</p>
    </div>
  ) : (
    <div className='container mx-auto space-y-6'>
      <div className='mb-6 flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>팝업 관리</h1>
          <p className='mt-1 text-gray-600'>사이트에 표시될 팝업을 관리할 수 있습니다.</p>
        </div>
        <Button onClick={() => router.push(ROUTES.ADMIN_POPUP_CREATE)}>새 팝업 추가</Button>
      </div>

      <div className='mb-4 flex items-center justify-between'>
        <h3 className='text-lg font-semibold text-gray-900'>전체 팝업 목록</h3>
        <p className='text-sm text-gray-600'>
          총 {data.pagination.total}개 팝업 (페이지 {currentPage}/{data.pagination.totalPages})
        </p>
      </div>

      <div className='overflow-hidden rounded-lg border bg-white'>
        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-gray-50'>
              <tr>
                {tableHeaders.map((header) => (
                  <th
                    key={header}
                    className='px-6 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase'
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-200 bg-white'>
              {data.popups.map((popup: PopupListItem) => (
                <tr key={popup.nw_id} className='transition-colors hover:bg-gray-50'>
                  <td className='px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900'>
                    {popup.nw_id}
                  </td>
                  <td className='max-w-xs px-6 py-4 text-sm text-gray-900'>
                    <div className='truncate font-medium' title={popup.nw_subject}>
                      {truncateText(popup.nw_subject, 30)}
                    </div>
                  </td>
                  <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-900'>
                    <span className='inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800'>
                      {POPUP_DEVICE_LABELS[popup.nw_device]}
                    </span>
                  </td>
                  <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-900'>
                    {formatDate(popup.nw_begin_time)}
                  </td>
                  <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-900'>
                    {formatDate(popup.nw_end_time)}
                  </td>
                  <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-900'>
                    {popup.nw_disable_hours}시간
                  </td>
                  <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-900'>
                    {popup.nw_left}, {popup.nw_top}
                  </td>
                  <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-900'>
                    {popup.nw_width} × {popup.nw_height}
                  </td>
                  <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-900'>
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${popup.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                    >
                      {popup.is_active ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-900'>
                    <div className='flex space-x-2'>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => handleEdit(popup.nw_id)}
                        className='text-blue-600 hover:text-blue-900'
                      >
                        수정
                      </Button>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => handleDelete(popup.nw_id, popup.nw_subject)}
                        className='text-red-600 hover:text-red-900'
                      >
                        삭제
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data.popups.length === 0 && (
          <div className='py-12 text-center'>
            <p className='text-gray-500'>등록된 팝업이 없습니다.</p>
          </div>
        )}
      </div>

      <div className='mt-6 flex justify-center'>
        <CommonPagination
          currentPage={data.pagination.page}
          totalPages={data.pagination.totalPages}
          pathname={ROUTES.ADMIN_POPUP}
        />
      </div>

      <MessageDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={dialogTitle}
        description={dialogMessage}
        onConfirm={dialogConfirm}
      />
    </div>
  );
}
