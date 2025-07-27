'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/primitives/button';
import { Calendar } from '@/components/ui/primitives/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/primitives/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/primitives/select';
import { CalendarIcon, Search } from 'lucide-react';
import LoadingState from '@/components/states/LoadingState';
import ErrorState from '@/components/states/ErrorState';
import EmptyState from '@/components/states/EmptyState';
import CommonPagination from '@/components/CommonPagination';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import dayjs from 'dayjs';

interface VendorData {
  mb_no: number;
  mb_id: string;
  mb_name: string;
  mb_level: number;
  vendor_name: string | null;
  vendor_class: string | null;
  vendor_representative: string | null;
  vendor_tel: string | null;
  vendor_email: string | null;
  vendor_fax: string | null;
  vendor_number: string | null;
  vendro_request_date: string | null;
  vendro_apply_date: string | null;
}

export default function AdminVendorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // URL 파라미터에서 초기값 설정
  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  const [searchType, setSearchType] = useState(searchParams.get('searchType') || 'mb_id');
  const [searchKeyword, setSearchKeyword] = useState(searchParams.get('stx') || '');
  const [startDate, setStartDate] = useState<Date | undefined>(
    searchParams.get('startDt') ? new Date(searchParams.get('startDt')!) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    searchParams.get('endDt') ? new Date(searchParams.get('endDt')!) : undefined
  );
  
  const [vendors, setVendors] = useState<VendorData[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const limit = 10;

  // 데이터 로드
  const loadVendors = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (status && status !== 'all') params.append('status', status);
      if (searchType && searchKeyword) {
        params.append('searchType', searchType);
        params.append('stx', searchKeyword);
      }
      if (startDate) params.append('startDt', dayjs(startDate).format('YYYY-MM-DD'));
      if (endDate) params.append('endDt', dayjs(endDate).format('YYYY-MM-DD'));
      params.append('page', currentPage.toString());
      params.append('limit', limit.toString());

      const response = await fetch(`/api/admin/vendor?${params}`);
      if (!response.ok) throw new Error('데이터를 불러오는데 실패했습니다.');
      
      const data = await response.json();
      setVendors(data.vendors);
      setTotalCount(data.totalCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [status, searchType, searchKeyword, startDate, endDate, currentPage, limit]);

  useEffect(() => {
    loadVendors();
  }, [loadVendors]);

  // URL 파라미터 업데이트
  const updateQueryParams = () => {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.append('status', status);
    if (searchType) params.append('searchType', searchType);
    if (searchKeyword) params.append('stx', searchKeyword);
    if (startDate) params.append('startDt', dayjs(startDate).format('YYYY-MM-DD'));
    if (endDate) params.append('endDt', dayjs(endDate).format('YYYY-MM-DD'));
    params.append('page', currentPage.toString());
    
    router.push(`/admin/vendor?${params}`);
  };

  // 검색 처리
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    updateQueryParams();
  };

  // 전체 선택/해제
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(vendors.map(v => v.mb_no)));
    } else {
      setSelectedItems(new Set());
    }
  };

  // 개별 선택
  const handleSelectItem = (mb_no: number, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(mb_no);
    } else {
      newSelected.delete(mb_no);
    }
    setSelectedItems(newSelected);
  };

  // 등급 변경
  const handleLevelChange = async (mb_id: string, newLevel: string) => {
    try {
      const response = await fetch('/api/admin/vendor/update-level', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'single',
          mb_id: [mb_id],
          mb_level: [newLevel],
        }),
      });

      if (!response.ok) throw new Error('등급 변경에 실패했습니다.');
      
      await loadVendors(); // 데이터 새로고침
    } catch (err) {
      alert(err instanceof Error ? err.message : '오류가 발생했습니다.');
    }
  };

  // 선택 항목 일괄 등급 변경
  const handleBatchLevelChange = async () => {
    if (selectedItems.size === 0) {
      alert('선택된 항목이 없습니다.');
      return;
    }

    try {
      const selectedVendors = vendors.filter(v => selectedItems.has(v.mb_no));
      const mb_ids = selectedVendors.map(v => v.mb_id);
      const mb_levels = selectedVendors.map(v => {
        const selectElement = document.querySelector(`select[data-mb-no="${v.mb_no}"]`) as HTMLSelectElement;
        return selectElement?.value || v.mb_level.toString();
      });

      const response = await fetch('/api/admin/vendor/update-level', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'multi',
          mb_id: mb_ids,
          mb_level: mb_levels,
        }),
      });

      if (!response.ok) throw new Error('등급 변경에 실패했습니다.');
      
      alert('성공적으로 변경되었습니다.');
      setSelectedItems(new Set());
      await loadVendors();
    } catch (err) {
      alert(err instanceof Error ? err.message : '오류가 발생했습니다.');
    }
  };

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={loadVendors} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">벤더 관리</h2>
      </div>

      {/* 검색 폼 */}
      <form onSubmit={handleSearch} className="bg-gray-50 p-4 rounded-lg space-y-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-sm font-medium mb-1">회원등급</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="2">준회원</SelectItem>
                <SelectItem value="3">정회원</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">신청일</label>
            <div className="flex gap-2 items-center">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-32 justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? dayjs(startDate).format('YYYY-MM-DD') : '시작일'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    disabled={(date) => dayjs(date).isAfter(dayjs())}
                  />
                </PopoverContent>
              </Popover>
              <span>~</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-32 justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? dayjs(endDate).format('YYYY-MM-DD') : '종료일'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => 
                      dayjs(date).isAfter(dayjs()) || 
                      (startDate ? dayjs(date).isBefore(dayjs(startDate)) : false)
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">검색</label>
            <div className="flex gap-2">
              <Select value={searchType} onValueChange={setSearchType}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mb_id">아이디</SelectItem>
                  <SelectItem value="mb_name">이름</SelectItem>
                </SelectContent>
              </Select>
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="검색어를 입력하세요"
                className="px-3 py-2 border rounded-md"
              />
              <Button type="submit">
                <Search className="h-4 w-4 mr-1" />
                검색
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* 전체 카운트 */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          전체 <span className="font-semibold">{totalCount}</span>건
        </p>
        <Button onClick={() => setShowConfirmDialog(true)}>선택수정</Button>
      </div>

      {/* 벤더 목록 테이블 */}
      {vendors.length === 0 ? (
        <EmptyState message="조회된 벤더가 없습니다." />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={vendors.length > 0 && selectedItems.size === vendors.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">아이디</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">이름</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">사업자구분</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">상호</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">대표자명</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">연락처</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">이메일</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">사업자등록번호</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">신청일시</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">승인일시</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">관리</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vendors.map((vendor) => (
                  <tr key={vendor.mb_no}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(vendor.mb_no)}
                        onChange={(e) => handleSelectItem(vendor.mb_no, e.target.checked)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm">{vendor.mb_id}</td>
                    <td className="px-4 py-3 text-sm">{vendor.mb_name}</td>
                    <td className="px-4 py-3 text-sm">{vendor.vendor_class || '-'}</td>
                    <td className="px-4 py-3 text-sm">{vendor.vendor_name || '-'}</td>
                    <td className="px-4 py-3 text-sm">{vendor.vendor_representative || '-'}</td>
                    <td className="px-4 py-3 text-sm">{vendor.vendor_tel || '-'}</td>
                    <td className="px-4 py-3 text-sm">{vendor.vendor_email || '-'}</td>
                    <td className="px-4 py-3 text-sm">{vendor.vendor_number || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      {vendor.vendro_request_date 
                        ? dayjs(vendor.vendro_request_date).format('YYYY-MM-DD HH:mm')
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {vendor.vendro_apply_date 
                        ? dayjs(vendor.vendro_apply_date).format('YYYY-MM-DD HH:mm')
                        : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        data-mb-no={vendor.mb_no}
                        value={vendor.mb_level}
                        onChange={(e) => handleLevelChange(vendor.mb_id, e.target.value)}
                        className="border rounded px-2 py-1 text-sm"
                      >
                        <option value="2">준회원</option>
                        <option value="3">정회원</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/vendor/${vendor.mb_no}?${searchParams.toString()}`}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        상세보기
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <CommonPagination
            currentPage={currentPage}
            totalPages={Math.ceil(totalCount / limit)}
            pathname="/admin/vendor"
            onPageChange={setCurrentPage}
          />
        </>
      )}

      <ConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        title="등급 변경"
        description="선택한 벤더의 등급을 변경하시겠습니까?"
        onConfirm={handleBatchLevelChange}
      />
    </div>
  );
} 