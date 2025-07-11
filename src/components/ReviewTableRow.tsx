import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/primitives/button';
import { Checkbox } from '@/components/ui/primitives/checkbox';
import LoadingSpinner from '@/components/states/LoadingSpinner';
import { ReviewItem } from '@/types/review';

interface ReviewTableRowProps {
  item: ReviewItem;
  imageErrors: Set<string>;
  visibilityLoading: string | null;
  actionLoading: string | null;
  onImageError: (itemId: string) => void;
  onToggleVisibility: (itemId: string, currentVisibility: '1' | '0' | number) => void;
  onShowConfirmDialog: (itemId: string, action: 'payment' | 'review', itemName: string) => void;
}

export function ReviewTableRow({
  item,
  imageErrors,
  visibilityLoading,
  actionLoading,
  onImageError,
  onToggleVisibility,
  onShowConfirmDialog,
}: ReviewTableRowProps) {
  return (
    <tr key={item.it_id} className='hover:bg-gray-50'>
      <td className='px-6 py-4 text-center'>
        <div className='flex justify-center'>
          {imageErrors.has(item.it_id) ? (
            <div className='flex h-12 w-12 items-center justify-center rounded-lg bg-gray-200 text-center'>
              <span className='text-xs text-gray-400'>
                이미지
                <br />
                없음
              </span>
            </div>
          ) : (
            <Image
              src={item.it_img1 || '/images/no-image.png'}
              alt={item.it_name}
              width={48}
              height={48}
              className='h-12 w-12 rounded-lg object-cover'
              onError={() => onImageError(item.it_id)}
            />
          )}
        </div>
      </td>
      <td className='px-6 py-4 text-center'>
        <div className='text-sm text-gray-900'>
          <p className='font-medium'>{item.it_name}</p>
        </div>
      </td>
      <td className='px-6 py-4 text-center'>
        <div className='text-sm text-gray-900'>
          <p className='text-gray-600'>{item.it_id}</p>
        </div>
      </td>
      <td className='px-6 py-4 text-center'>
        <div className='text-sm text-gray-900'>
          <div className='font-medium'>{item.it_1}</div>
        </div>
      </td>
      <td className='px-6 py-4 text-center'>
        <div className='text-sm text-gray-900'>
          <div className='font-medium'>{item.it_price?.toLocaleString() || 0}원</div>
        </div>
      </td>
      <td className='px-6 py-4 text-center'>
        <div className='text-sm text-gray-900'>
          <div>
            <span className='font-medium'>{item.interest_count}</span>
            <span className='text-gray-400'> / </span>
            <span>{item.it_4}</span>
            {!item.goal_achieved && item.review_status === 'in_review' && (
              <span className='ml-2 inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800'>
                ⚠️ 수동 설정
              </span>
            )}
          </div>
          <div className='mt-1 h-1.5 w-full rounded-full bg-gray-200'>
            <div
              className='bg-primary h-1.5 rounded-full'
              style={{
                width: `${Math.min((item.interest_count / item.it_4) * 100, 100)}%`,
              }}
            />
          </div>
        </div>
      </td>
      <td className='px-6 py-4 text-center'>
        <div className='flex justify-center'>
          <div className='flex items-center space-x-2'>
            {visibilityLoading === item.it_id ? (
              <LoadingSpinner size='sm' className='mb-0' />
            ) : (
              <label className='flex cursor-pointer items-center space-x-2'>
                <Checkbox
                  checked={Number(item.it_use) === 1}
                  onCheckedChange={() => onToggleVisibility(item.it_id, item.it_use)}
                  disabled={visibilityLoading === item.it_id}
                />
                <span className='text-sm text-gray-700'>
                  {Number(item.it_use) === 1 ? '승인' : '반려'}
                </span>
              </label>
            )}
          </div>
        </div>
      </td>
      <td className='px-6 py-4 text-center'>
        <div className='flex justify-center'>
          <div className='flex space-x-2'>
            <Button
              onClick={() => onShowConfirmDialog(item.it_id, 'payment', item.it_name)}
              disabled={actionLoading === item.it_id || item.review_status === 'approved'}
              variant={item.review_status === 'approved' ? 'outline' : 'default'}
              size='sm'
              className={
                item.review_status === 'approved'
                  ? 'cursor-not-allowed bg-gray-300 text-gray-500 hover:bg-gray-300'
                  : ''
              }
              title={
                item.review_status === 'approved'
                  ? '이미 구매 진행 상태입니다'
                  : '구매 진행 상태로 변경'
              }
            >
              {actionLoading === item.it_id ? (
                <LoadingSpinner size='sm' className='mb-0 border-white' />
              ) : (
                '구매 진행'
              )}
            </Button>

            <Button
              onClick={() => onShowConfirmDialog(item.it_id, 'review', item.it_name)}
              disabled={
                actionLoading === item.it_id ||
                ['pending', 'in_review', 'rejected'].includes(item.review_status)
              }
              variant={
                ['pending', 'in_review', 'rejected'].includes(item.review_status)
                  ? 'outline'
                  : 'secondary'
              }
              size='sm'
              className={
                ['pending', 'in_review', 'rejected'].includes(item.review_status)
                  ? 'cursor-not-allowed bg-gray-300 text-gray-500 hover:bg-gray-300'
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }
              title={
                ['pending', 'in_review', 'rejected'].includes(item.review_status)
                  ? '이미 제작 검토 상태입니다'
                  : '제작 검토 단계로 변경'
              }
            >
              {actionLoading === item.it_id ? (
                <LoadingSpinner size='sm' className='mb-0 border-white' />
              ) : (
                '제작 검토'
              )}
            </Button>
          </div>
        </div>
      </td>
    </tr>
  );
}
