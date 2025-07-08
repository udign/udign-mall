'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AdminUser, MemberListResponse } from '@/types/user';
import CommonPagination from '@/components/CommonPagination';
import { ROUTES } from '@/lib/routes';

interface MemberStatusSelectProps {
  memberId: string;
  currentStatus: 'normal' | 'leave' | 'blocked';
  onStatusChange: (memberId: string, newStatus: 'normal' | 'leave' | 'blocked') => void;
}

function MemberStatusSelect({ memberId, currentStatus, onStatusChange }: MemberStatusSelectProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'text-green-600 bg-green-50';
      case 'leave':
        return 'text-gray-600 bg-gray-50';
      case 'blocked':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <select
      value={currentStatus}
      onChange={(e) => onStatusChange(memberId, e.target.value as 'normal' | 'leave' | 'blocked')}
      className={`rounded-full border-0 px-3 py-1 text-sm font-medium focus:ring-2 focus:ring-blue-500 ${getStatusColor(currentStatus)}`}
    >
      <option value='normal'>정상</option>
      <option value='leave'>탈퇴</option>
      <option value='blocked'>차단</option>
    </select>
  );
}

export default function MemberManagePage() {
  const [members, setMembers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

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
      alert('회원 목록을 가져오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  // 회원 상태 변경
  const handleStatusChange = useCallback(
    async (memberId: string, newStatus: 'normal' | 'leave' | 'blocked') => {
      try {
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

        // 성공 시 목록 새로고침
        await fetchData();
        alert('회원 상태가 성공적으로 변경되었습니다.');
      } catch (error) {
        console.error('상태 변경 오류:', error);
        alert(error instanceof Error ? error.message : '상태 변경에 실패했습니다.');
      }
    },
    [fetchData],
  );

  // 페이지 변경 처리
  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`${ROUTES.ADMIN_MEMBER}?${params.toString()}`);
  };

  useEffect(() => {
    // 초기 로드 시 URL 파라미터가 없으면 기본값으로 설정
    if (!searchParams.get('page')) {
      const params = new URLSearchParams();
      params.set('page', '1');
      router.replace(`${ROUTES.ADMIN_MEMBER}?${params.toString()}`);
    } else {
      fetchData();
    }
  }, [searchParams, router, fetchData]);

  // 날짜 포맷 함수
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  // 권한 레벨 표시
  const getLevelLabel = (level: number) => {
    if (level >= 10) return '관리자';
    if (level >= 5) return '우수회원';
    if (level >= 2) return '정회원';
    return '일반회원';
  };

  return (
    <div className='p-6'>
      <div className='mb-6'>
        <h1 className='mb-2 text-2xl font-bold text-gray-900'>회원 관리</h1>
        <p className='text-gray-600'>전체 회원 {totalCount.toLocaleString()}명</p>
      </div>

      <div className='overflow-hidden rounded-lg bg-white shadow'>
        {loading ? (
          <div className='p-8 text-center'>
            <div className='inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600'></div>
            <p className='mt-2 text-gray-600'>로딩 중...</p>
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                    아이디
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                    이름
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                    닉네임
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                    상태
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                    권한
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                    휴대폰
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                    전화번호
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                    최종접속
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                    가입일
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-200 bg-white'>
                {members.length === 0 ? (
                  <tr>
                    <td colSpan={9} className='px-6 py-4 text-center text-gray-500'>
                      조회된 회원이 없습니다.
                    </td>
                  </tr>
                ) : (
                  members.map((member) => (
                    <tr key={member.mb_id} className='hover:bg-gray-50'>
                      <td className='px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900'>
                        {member.mb_id}
                      </td>
                      <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-900'>
                        {member.mb_name}
                      </td>
                      <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-900'>
                        {member.mb_nick}
                      </td>
                      <td className='px-6 py-4 text-sm whitespace-nowrap'>
                        <MemberStatusSelect
                          memberId={member.mb_id}
                          currentStatus={member.mb_status}
                          onStatusChange={handleStatusChange}
                        />
                      </td>
                      <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-900'>
                        <span className='inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800'>
                          {getLevelLabel(member.mb_level)} ({member.mb_level})
                        </span>
                      </td>
                      <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-900'>
                        {member.mb_hp || '-'}
                      </td>
                      <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-900'>
                        {member.mb_tel || '-'}
                      </td>
                      <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-900'>
                        {formatDate(member.mb_today_login)}
                      </td>
                      <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-900'>
                        {formatDate(member.mb_datetime)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
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
    </div>
  );
}
