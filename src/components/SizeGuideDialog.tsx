'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/primitives/dialog';

interface SizeGuideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SizeGuideData {
  id: number;
  area: string;
  size_s: string;
  size_m: string;
  size_l: string;
  sort_order: number;
  is_active: boolean;
}

export default function SizeGuideDialog({ open, onOpenChange }: SizeGuideDialogProps) {
  const [sizeData, setSizeData] = useState<SizeGuideData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    if (open) {
      fetchSizeGuideData();
    } else {
      setSizeData([]);
      setHasError(false);
      setLoading(false);
    }
  }, [open]);

  const fetchSizeGuideData = async () => {
    try {
      setLoading(true);
      setHasError(false);
      setSizeData([]);

      const response = await fetch('/api/admin/size-guide');
      const result = await response.json();

      if (result.success && result.data && result.data.length > 0) {
        setSizeData(result.data);
      } else {
        console.error('사이즈 가이드 조회 실패:', result.error);
        setHasError(true);
      }
    } catch (error) {
      console.error('사이즈 가이드 조회 오류:', error);
      setHasError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-lg'>
        <DialogHeader>
          <DialogTitle className='text-center'>사이즈 가이드</DialogTitle>
          <DialogDescription className='text-center text-sm text-gray-600'>
            정확한 사이즈 선택을 위한 측정 가이드입니다
          </DialogDescription>
        </DialogHeader>

        <div>
          {loading ? (
            <div className='py-8 text-center'>
              <div className='mb-4 text-sm text-gray-600'>사이즈 가이드를 불러오는 중...</div>
            </div>
          ) : hasError || sizeData.length === 0 ? (
            <div className='py-8 text-center'>
              <div className='mb-4 text-lg font-medium text-gray-900'>📏</div>
              <div className='mb-2 text-base font-medium text-gray-900'>
                사이즈 가이드 지원 안함
              </div>
              <div className='text-sm text-gray-600'>
                이 작품은 사이즈 가이드를 지원하지 않습니다.
              </div>
            </div>
          ) : (
            <>
              <div className='max-h-[50vh] overflow-y-auto rounded-lg border border-gray-200'>
                <table className='w-full'>
                  <thead className='sticky top-0 z-10'>
                    <tr className='bg-gray-50'>
                      <th className='px-4 py-3 text-left text-sm font-medium text-gray-700'>
                        구역
                      </th>
                      <th className='px-4 py-3 text-center text-sm font-medium text-gray-700'>
                        S (KR 90)
                      </th>
                      <th className='px-4 py-3 text-center text-sm font-medium text-gray-700'>
                        M (KR 95-100)
                      </th>
                      <th className='px-4 py-3 text-center text-sm font-medium text-gray-700'>
                        L (KR 100-105)
                      </th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-200 bg-white'>
                    {sizeData.map((row, index) => (
                      <tr key={row.id || index} className='hover:bg-gray-50'>
                        <td className='px-4 py-3 text-sm text-gray-900'>{row.area}</td>
                        <td className='px-4 py-3 text-center text-sm text-gray-700'>
                          {row.size_s?.trim() || '-'}
                        </td>
                        <td className='px-4 py-3 text-center text-sm text-gray-700'>
                          {row.size_m?.trim() || '-'}
                        </td>
                        <td className='px-4 py-3 text-center text-sm text-gray-700'>
                          {row.size_l?.trim() || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className='mt-6 rounded-lg bg-blue-50 p-4'>
                <h4 className='mb-2 text-sm font-medium text-blue-900'>📏 측정 방법</h4>
                <ul className='space-y-1 text-xs text-blue-800'>
                  <li>• 평평한 곳에 옷을 펼쳐놓고 측정해주세요</li>
                  <li>• 신축성이 있는 원단의 경우 자연스럽게 놓인 상태에서 측정</li>
                  <li>• 모든 수치는 cm 단위입니다</li>
                </ul>
              </div>

              <div className='mt-4 rounded-lg bg-yellow-50 p-4'>
                <h4 className='mb-2 text-sm font-medium text-yellow-900'>⚠️ 주의사항</h4>
                <ul className='space-y-1 text-xs text-yellow-800'>
                  <li>• 측정 방법에 따라 1-3cm 차이가 날 수 있습니다</li>
                  <li>• 모니터 환경에 따라 색상이 다르게 보일 수 있습니다</li>
                  <li>• 세탁 후 약간의 수축이 있을 수 있습니다</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
