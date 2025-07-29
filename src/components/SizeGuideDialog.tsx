'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/primitives/dialog';
import { Dictionary } from '@/lib/dictionaries';

interface SizeGuideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dictionary: Dictionary;
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

export default function SizeGuideDialog({ open, onOpenChange, dictionary }: SizeGuideDialogProps) {
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
          <DialogTitle className='text-center'>
            {dictionary.productDetail.sizeGuide.title}
          </DialogTitle>
          <DialogDescription className='text-center text-sm text-gray-600'>
            {dictionary.productDetail.sizeGuide.description}
          </DialogDescription>
        </DialogHeader>

        <div>
          {loading ? (
            <div className='py-8 text-center'>
              <div className='mb-4 text-sm text-gray-600'>
                {dictionary.productDetail.sizeGuide.loading}
              </div>
            </div>
          ) : hasError || sizeData.length === 0 ? (
            <div className='py-8 text-center'>
              <div className='mb-4 text-lg font-medium text-gray-900'>📏</div>
              <div className='mb-2 text-base font-medium text-gray-900'>
                {dictionary.productDetail.sizeGuide.notSupported}
              </div>
              <div className='text-sm text-gray-600'>
                {dictionary.productDetail.sizeGuide.notSupportedDesc}
              </div>
            </div>
          ) : (
            <>
              <div className='max-h-[50vh] overflow-y-auto rounded-lg border border-gray-200'>
                <table className='w-full'>
                  <thead className='sticky top-0 z-10'>
                    <tr className='bg-gray-50'>
                      <th className='px-4 py-3 text-left text-sm font-medium text-gray-700'>
                        {dictionary.productDetail.sizeGuide.area}
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
                <h4 className='mb-2 text-sm font-medium text-blue-900'>
                  {dictionary.productDetail.sizeGuide.measurementMethod}
                </h4>
                <ul className='space-y-1 text-xs text-blue-800'>
                  {dictionary.productDetail.sizeGuide.measurementTips.map((tip, index) => (
                    <li key={index}>• {tip}</li>
                  ))}
                </ul>
              </div>

              <div className='mt-4 rounded-lg bg-yellow-50 p-4'>
                <h4 className='mb-2 text-sm font-medium text-yellow-900'>
                  {dictionary.productDetail.sizeGuide.precautions}
                </h4>
                <ul className='space-y-1 text-xs text-yellow-800'>
                  {dictionary.productDetail.sizeGuide.precautionsList.map((precaution, index) => (
                    <li key={index}>• {precaution}</li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
