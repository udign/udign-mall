import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/primitives/button';
import { Switch } from '@/components/ui/primitives/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/primitives/popover';
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
      <td className='px-4 py-3 text-center'>
        <div className='text-sm text-gray-900'>
          <p className='text-gray-600'>{item.it_id}</p>
        </div>
      </td>
      <td className='px-4 py-3 text-center'>
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
              className='h-12 min-w-12 rounded-lg object-cover'
              onError={() => onImageError(item.it_id)}
            />
          )}
        </div>
      </td>
      <td className='px-4 py-3 text-center'>
        <div className='text-sm text-gray-900'>
          <p className='font-medium'>{item.it_name}</p>
          <p className='mt-1 text-xs text-gray-500'>{item.it_1}</p>
        </div>
      </td>
      <td className='px-4 py-3 text-center'>
        <div className='text-sm text-gray-900'>
          <div className='font-medium'>{item.it_price?.toLocaleString() || 0}원</div>
        </div>
      </td>
      <td className='px-4 py-3 text-center'>
        <div className='text-sm text-gray-900'>
          <div className='font-medium'>{item.it_stock_qty}개</div>
        </div>
      </td>
      <td className='px-4 py-3 text-center'>
        <div className='text-sm text-gray-900'>
          {item.options && item.options.length > 0 ? (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-8 text-xs font-medium text-blue-600 hover:text-blue-700'
                >
                  {item.options.length}개 옵션
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-80 p-3' side='left' align='center'>
                <div className='space-y-2'>
                  <h4 className='text-sm font-medium text-gray-900'>옵션별 재고</h4>
                  <div className='max-h-32 space-y-2 overflow-y-auto'>
                    {item.options.map((option, index) => (
                      <div
                        key={index}
                        className='flex items-center justify-between rounded bg-gray-50 p-2'
                      >
                        <span className='flex-1 text-xs text-gray-700'>
                          {option.option_display}
                        </span>
                        <div className='ml-2 text-right'>
                          <div className='text-xs text-gray-600'>
                            {option.io_price > 0
                              ? `+${option.io_price.toLocaleString()}원`
                              : '기본'}
                          </div>
                          <div className='text-xs font-medium text-gray-500'>
                            재고 {option.io_stock_qty}개
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          ) : (
            <div className='text-xs text-gray-500'>옵션 없음</div>
          )}
        </div>
      </td>
      <td className='px-4 py-3 text-center'>
        <div className='text-sm text-gray-900'>
          <div className='font-medium'>{item.it_4 > 0 ? item.it_4 : '미설정'}</div>
        </div>
      </td>
      <td className='px-4 py-3 text-center'>
        <div className='flex justify-center'>
          <div className='flex items-center space-x-2'>
            <Switch
              checked={Number(item.it_use) === 1}
              onCheckedChange={() => onToggleVisibility(item.it_id, item.it_use)}
              disabled={visibilityLoading === item.it_id}
              className='cursor-pointer'
            />
            <span className='text-sm text-gray-700'>
              {Number(item.it_use) === 1 ? '승인' : '반려'}
            </span>
          </div>
        </div>
      </td>
      <td className='px-4 py-3 text-center'>
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

            <Link href={`/admin/review/edit/${item.it_id}`}>
              <Button
                variant='outline'
                size='sm'
                className='border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                title='디자인 설정'
              >
                설정
              </Button>
            </Link>
          </div>
        </div>
      </td>
    </tr>
  );
}
