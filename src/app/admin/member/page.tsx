'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { AdminUser, MemberListResponse } from '@/types/user';
import CommonPagination from '@/components/CommonPagination';
import LoadingSpinner from '@/components/states/LoadingSpinner';
import { ROUTES } from '@/lib/routes';
import { Button } from '@/components/ui/primitives/button';
import MessageDialog from '@/components/ui/MessageDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/primitives/dropdown-menu';
import { ChevronDownIcon } from 'lucide-react';

dayjs.extend(utc);
dayjs.extend(timezone);

const statusOptions = [
  {
    value: 'normal' as const,
    label: '정상',
    color: 'text-green-600',
    bgColor: 'text-green-600 bg-green-50 border-green-200',
  },
  {
    value: 'leave' as const,
    label: '탈퇴',
    color: 'text-gray-600',
    bgColor: 'text-gray-600 bg-gray-50 border-gray-200',
  },
  {
    value: 'blocked' as const,
    label: '차단',
    color: 'text-red-600',
    bgColor: 'text-red-600 bg-red-50 border-red-200',
  },
];

const tableHeaders = [
  '아이디',
  '이름',
  '닉네임',
  '상태',
  '권한',
  '휴대폰',
  '전화번호',
  '최종접속',
  '가입일',
];

const levelOptions = [
  { minLevel: 10, label: '관리자' },
  { minLevel: 5, label: '우수회원' },
  { minLevel: 2, label: '정회원' },
  { minLevel: 0, label: '일반회원' },
];

const getStatusColor = (status: string) => {
  return (
    statusOptions.find((option) => option.value === status)?.bgColor ||
    'text-gray-600 bg-gray-50 border-gray-200'
  );
};

const getStatusLabel = (status: string) => {
  return statusOptions.find((option) => option.value === status)?.label || '정상';
};

const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  return dayjs(dateString).tz('Asia/Seoul').format('YYYY-MM-DD');
};

const getLevelLabel = (level: number) => {
  return levelOptions.find((option) => level >= option.minLevel)?.label || '일반회원';
};

export default function MemberManagePage() {
  const [members, setMembers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusLoading, setStatusLoading] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [messageDialog, setMessageDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
  }>({
    open: false,
    title: '',
    description: '',
  });

  const router = useRouter();
  const searchParams = useSearchParams();

  const currentPage = parseInt(searchParams.get('page') || '1');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch(`/api/admin/members?page=${currentPage}`);

      if (!response.ok) {
        throw new Error('회원 목록을 가져오는데 실패했습니다.');
      }

      const data: MemberListResponse = await response.json();

      setMembers(data.members);
      setTotalCount(data.totalCount);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('회원 목록 조회 오류:', error);
      setMessageDialog({
        open: true,
        title: '데이터 로드 실패',
        description: '회원 목록을 가져오는데 실패했습니다.',
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    if (!searchParams.get('page')) {
      const params = new URLSearchParams();
      params.set('page', '1');
      router.replace(`${ROUTES.ADMIN_MEMBER}?${params.toString()}`);
    } else {
      fetchData();
    }
  }, [searchParams, router, fetchData]);

  const handleMemberStatusChange = useCallback(
    async (memberId: string, newStatus: 'normal' | 'leave' | 'blocked') => {
      try {
        setStatusLoading(memberId);

        const response = await fetch(`/api/admin/members/${memberId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '상태 변경에 실패했습니다.');
        }

        setMembers((prev) =>
          prev.map((member) =>
            member.mb_id === memberId
              ? {
                  ...member,
                  mb_status: newStatus,
                }
              : member,
          ),
        );

        setMessageDialog({
          open: true,
          title: '상태 변경 완료',
          description: '회원 상태가 성공적으로 변경되었습니다.',
        });
      } catch (error) {
        console.error('상태 변경 오류:', error);
        setMessageDialog({
          open: true,
          title: '상태 변경 실패',
          description: error instanceof Error ? error.message : '상태 변경에 실패했습니다.',
        });
      } finally {
        setStatusLoading(null);
      }
    },
    [],
  );

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`${ROUTES.ADMIN_MEMBER}?${params.toString()}`);
  };

  return (
    <div className='p-6'>
      <div className='mb-6'>
        <h1 className='mb-2 text-2xl font-bold text-gray-900'>회원 관리</h1>
        <p className='text-gray-600'>전체 회원 {totalCount.toLocaleString()}명</p>
      </div>

      <div className='rounded-lg bg-white'>
        <div>
          <div className='mb-4 flex items-center justify-between'>
            <h3 className='text-lg font-semibold text-gray-900'>전체 회원 목록</h3>
            <p className='text-sm text-gray-600'>
              총 {totalCount}명 회원 (페이지 {currentPage}/{totalPages})
            </p>
          </div>

          {loading ? (
            <div className='mt-50'>
              <LoadingSpinner size='md' message='로딩 중...' />
            </div>
          ) : members.length === 0 ? (
            <div className='py-8 text-center text-gray-500'>조회된 회원이 없습니다.</div>
          ) : (
            <>
              <div className='overflow-x-auto'>
                <table className='min-w-full divide-y divide-gray-200'>
                  <thead className='bg-gray-50'>
                    <tr>
                      {tableHeaders.map((header, index) => (
                        <th
                          key={index}
                          className='px-6 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase'
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-200 bg-white'>
                    {members.map((member) => (
                      <tr key={member.mb_id} className='hover:bg-gray-50'>
                        <td className='px-6 py-4 text-center'>
                          <div className='text-sm font-medium text-gray-900'>{member.mb_id}</div>
                        </td>
                        <td className='px-6 py-4 text-center'>
                          <div className='text-sm text-gray-900'>{member.mb_name}</div>
                        </td>
                        <td className='px-6 py-4 text-center'>
                          <div className='text-sm text-gray-900'>{member.mb_nick}</div>
                        </td>
                        <td className='px-6 py-4 text-center'>
                          {statusLoading === member.mb_id ? (
                            <div className='flex items-center justify-center'>
                              <LoadingSpinner size='sm' className='mb-0' />
                              <span className='ml-2 text-sm text-gray-600'>변경 중...</span>
                            </div>
                          ) : (
                            <div className='flex justify-center'>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant='outline'
                                    size='sm'
                                    className={`h-8 rounded-full border px-3 text-sm font-medium ${getStatusColor(member.mb_status)}`}
                                    disabled={statusLoading !== null}
                                  >
                                    {getStatusLabel(member.mb_status)}
                                    <ChevronDownIcon className='ml-2 h-4 w-4' />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align='end'>
                                  {statusOptions.map((option) => (
                                    <DropdownMenuItem
                                      key={option.value}
                                      onClick={() =>
                                        handleMemberStatusChange(member.mb_id, option.value)
                                      }
                                      disabled={statusLoading !== null}
                                    >
                                      <span className={option.color}>{option.label}</span>
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          )}
                        </td>
                        <td className='px-6 py-4 text-center'>
                          <div className='text-sm text-gray-900'>
                            <span className='inline-flex items-center rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-800'>
                              {getLevelLabel(member.mb_level)} ({member.mb_level})
                            </span>
                          </div>
                        </td>
                        <td className='px-6 py-4 text-center'>
                          <div className='text-sm text-gray-900'>{member.mb_hp || '-'}</div>
                        </td>
                        <td className='px-6 py-4 text-center'>
                          <div className='text-sm text-gray-900'>{member.mb_tel || '-'}</div>
                        </td>
                        <td className='px-6 py-4 text-center'>
                          <div className='text-sm text-gray-900'>
                            {formatDate(member.mb_today_login)}
                          </div>
                        </td>
                        <td className='px-6 py-4 text-center'>
                          <div className='text-sm text-gray-900'>
                            {formatDate(member.mb_datetime)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className='mt-6 flex justify-center'>
                <CommonPagination
                  currentPageNumber={currentPage}
                  totalPageCount={totalPages}
                  pathname={ROUTES.ADMIN_MEMBER}
                  queryParams={{}}
                  onPageChange={handlePageChange}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <MessageDialog
        open={messageDialog.open}
        onOpenChange={(open) => setMessageDialog((prev) => ({ ...prev, open }))}
        title={messageDialog.title}
        description={messageDialog.description}
      />
    </div>
  );
}
