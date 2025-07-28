'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/primitives/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/primitives/select';
import LoadingState from '@/components/states/LoadingState';
import ErrorState from '@/components/states/ErrorState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

interface VendorDetail {
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
  vendor_introduction: string | null;
  mb_zip: string | null;
  mb_addr1: string | null;
  mb_addr2: string | null;
  mb_addr3: string | null;
  vendro_request_date: string | null;
  vendro_apply_date: string | null;
}

export default function AdminVendorDetailPage({ params }: { params: Promise<{ mb_no: string }> }) {
  const searchParams = useSearchParams();
  const [mb_no, setMbNo] = useState<string>('');
  const [vendor, setVendor] = useState<VendorDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [newLevel, setNewLevel] = useState<string>('');

  // params를 언래핑
  useEffect(() => {
    params.then(p => setMbNo(p.mb_no));
  }, [params]);

  // 벤더 정보 로드
  const loadVendorDetail = useCallback(async () => {
    if (!mb_no) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/vendor/${mb_no}`);
      if (!response.ok) throw new Error('데이터를 불러오는데 실패했습니다.');
      
      const data = await response.json();
      setVendor(data.vendor);
      setNewLevel(data.vendor.mb_level.toString());
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [mb_no]);

  useEffect(() => {
    if (mb_no) {
      loadVendorDetail();
    }
  }, [mb_no, loadVendorDetail]);

  // 등급 변경 처리
  const handleLevelChange = async () => {
    if (!vendor) return;

    try {
      const response = await fetch('/api/admin/vendor/update-level', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'single',
          mb_id: [vendor.mb_id],
          mb_level: [newLevel],
        }),
      });

      if (!response.ok) throw new Error('등급 변경에 실패했습니다.');
      
      alert('성공적으로 변경되었습니다.');
      await loadVendorDetail();
    } catch (err) {
      alert(err instanceof Error ? err.message : '오류가 발생했습니다.');
    }
  };

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={loadVendorDetail} />;
  if (!vendor) return <ErrorState message="벤더 정보를 찾을 수 없습니다." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">벤더 상세정보</h2>
        <Link href={`/admin/vendor?${searchParams.toString()}`}>
          <Button variant="outline">목록</Button>
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <table className="w-full">
            <tbody>
              <tr className="border-b">
                <th className="py-3 px-4 text-left bg-gray-50 w-1/4">아이디</th>
                <td className="py-3 px-4">{vendor.mb_id}</td>
                <th className="py-3 px-4 text-left bg-gray-50 w-1/4">회원등급</th>
                <td className="py-3 px-4">
                  <Select 
                    value={newLevel} 
                    onValueChange={(value) => {
                      setNewLevel(value);
                      setShowConfirmDialog(true);
                    }}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">준회원</SelectItem>
                      <SelectItem value="3">정회원</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
              </tr>
              <tr className="border-b">
                <th className="py-3 px-4 text-left bg-gray-50">이름</th>
                <td className="py-3 px-4">{vendor.mb_name}</td>
                <th className="py-3 px-4 text-left bg-gray-50">사업자구분</th>
                <td className="py-3 px-4">{vendor.vendor_class || '-'}</td>
              </tr>
              <tr className="border-b">
                <th className="py-3 px-4 text-left bg-gray-50">상호</th>
                <td className="py-3 px-4">{vendor.vendor_name || '-'}</td>
                <th className="py-3 px-4 text-left bg-gray-50">대표자명</th>
                <td className="py-3 px-4">{vendor.vendor_representative || '-'}</td>
              </tr>
              <tr className="border-b">
                <th className="py-3 px-4 text-left bg-gray-50">연락처</th>
                <td className="py-3 px-4">{vendor.vendor_tel || '-'}</td>
                <th className="py-3 px-4 text-left bg-gray-50">이메일</th>
                <td className="py-3 px-4">{vendor.vendor_email || '-'}</td>
              </tr>
              <tr className="border-b">
                <th className="py-3 px-4 text-left bg-gray-50">팩스</th>
                <td className="py-3 px-4">{vendor.vendor_fax || '-'}</td>
                <th className="py-3 px-4 text-left bg-gray-50">사업자등록번호</th>
                <td className="py-3 px-4">{vendor.vendor_number || '-'}</td>
              </tr>
              <tr className="border-b">
                <th className="py-3 px-4 text-left bg-gray-50">주소</th>
                <td className="py-3 px-4" colSpan={3}>
                  {vendor.mb_zip && (
                    <>
                      <div>우({vendor.mb_zip})</div>
                      <div>{vendor.mb_addr1}</div>
                      {(vendor.mb_addr2 || vendor.mb_addr3) && (
                        <div>{vendor.mb_addr2} {vendor.mb_addr3}</div>
                      )}
                    </>
                  )}
                  {!vendor.mb_zip && '-'}
                </td>
              </tr>
              <tr>
                <th className="py-3 px-4 text-left bg-gray-50 align-top">회사소개</th>
                <td className="py-3 px-4" colSpan={3}>
                  <div className="whitespace-pre-wrap">
                    {vendor.vendor_introduction || '-'}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        title="등급 변경"
        description={`${vendor.mb_id}님을 ${newLevel === '2' ? '준회원' : '정회원'}으로 변경하시겠습니까?`}
        onConfirm={handleLevelChange}
        onCancel={() => setNewLevel(vendor.mb_level.toString())}
      />
    </div>
  );
} 