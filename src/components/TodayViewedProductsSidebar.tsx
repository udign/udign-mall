'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Trash2, ShoppingBag } from 'lucide-react';
import { useTodayViewedProducts } from '@/hooks/useTodayViewedProducts';
import { ROUTES } from '@/lib/routes';
import { Button } from '@/components/ui/primitives/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/primitives/sheet';
import { Separator } from '@/components/ui/primitives/separator';
import LoadingSpinner from '@/components/states/LoadingSpinner';

interface TodayViewedProductsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TodayViewedProductsSidebar({
  isOpen,
  onClose,
}: TodayViewedProductsSidebarProps) {
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const router = useRouter();

  const { viewedProducts, isLoadingTodayViewed, removeViewedProduct, clearViewedProducts } =
    useTodayViewedProducts();

  const handleProductClick = (productId: string) => {
    router.push(`${ROUTES.PRODUCT}/${productId}`);
    onClose();
  };

  const handleRemoveProduct = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    removeViewedProduct(productId);
  };

  const handleClearAll = () => {
    clearViewedProducts();
  };

  const handleImageError = (productId: string) => {
    setFailedImages((prev) => new Set(prev).add(productId));
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side='right' className='w-96 p-0 [&>button]:hidden'>
        <SheetHeader className='sr-only'>
          <SheetTitle>오늘 본 작품</SheetTitle>
          <SheetDescription>오늘 확인한 작품 목록을 표시합니다.</SheetDescription>
        </SheetHeader>

        <div className='flex h-full flex-col'>
          <div className='flex items-center justify-between border-b p-4'>
            <div className='flex items-center gap-2'>
              <ShoppingBag className='h-5 w-5 text-gray-600' />
              <h2 className='text-lg font-semibold'>오늘 본 작품</h2>
              <span className='rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600'>
                {viewedProducts.length}
              </span>
            </div>
            <Button variant='ghost' size='sm' onClick={onClose}>
              <X className='h-4 w-4' />
            </Button>
          </div>

          <div className='flex-1 overflow-auto'>
            {isLoadingTodayViewed ? (
              <div className='flex items-center justify-center p-8'>
                <LoadingSpinner size='md' />
              </div>
            ) : viewedProducts.length === 0 ? (
              <div className='flex flex-col items-center justify-center p-8 text-center'>
                <ShoppingBag className='mb-2 h-12 w-12 text-gray-300' />
                <h3 className='mb-2 text-lg font-medium text-gray-900'>아직 본 작품이 없습니다</h3>
              </div>
            ) : (
              <div className='space-y-1 p-4'>
                <div className='mb-3 flex items-center justify-between'>
                  <p className='text-sm text-gray-600'>
                    최근 확인한 작품 {viewedProducts.length}개
                  </p>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={handleClearAll}
                    className='text-xs text-red-500 hover:text-red-700'
                  >
                    전체 삭제
                  </Button>
                </div>

                <div className='space-y-2'>
                  {viewedProducts.map((product) => (
                    <div
                      key={product.it_id}
                      onClick={() => handleProductClick(product.it_id)}
                      className='group cursor-pointer rounded-lg border p-3 transition-all hover:border-gray-300'
                    >
                      <div className='flex gap-3'>
                        <div className='relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md'>
                          {!failedImages.has(product.it_id) && product.it_img1 ? (
                            <Image
                              src={product.it_img1}
                              alt={product.it_name}
                              fill
                              className='object-cover'
                              onError={() => handleImageError(product.it_id)}
                            />
                          ) : (
                            <div className='flex h-full w-full items-center justify-center bg-gray-200'>
                              <span className='text-xs text-gray-400'>이미지 없음</span>
                            </div>
                          )}
                        </div>
                        <div className='flex min-w-0 flex-1 flex-col justify-between'>
                          <div>
                            <h4 className='line-clamp-2 text-sm font-medium text-gray-900'>
                              {product.it_name}
                            </h4>
                            <p className='mt-1 text-xs text-gray-500'>by {product.creator_name}</p>
                          </div>
                          <p className='text-sm font-semibold text-gray-900'>
                            {product.it_price.toLocaleString()}원
                          </p>
                        </div>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={(e) => handleRemoveProduct(e, product.it_id)}
                          className='opacity-0 transition-opacity group-hover:opacity-100'
                        >
                          <Trash2 className='h-4 w-4 text-gray-400 hover:text-red-500' />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {viewedProducts.length > 0 && (
            <>
              <Separator />
              <div className='p-4'>
                <p className='text-center text-xs text-gray-500'>
                  상품은 하루 동안 최대 {10}개까지 저장됩니다
                </p>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
