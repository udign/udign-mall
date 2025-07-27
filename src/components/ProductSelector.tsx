'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/primitives/card';
import { Button } from '@/components/ui/primitives/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/primitives/tabs';
import LoadingState from '@/components/states/LoadingState';
import EmptyState from '@/components/states/EmptyState';
import { ProductForReport, ProductSearchResponse } from '@/types/copyright-report';
import { getImageUrl } from '@/lib/utils';

interface ProductSelectorProps {
  onSelect: (product: ProductForReport) => void;
  onCancel: () => void;
  currentUserId: string;
}

const CATEGORIES = [
  { id: '', name: '전체' },
  { id: '10', name: 'Fashion' },
  { id: '20', name: 'Shoes' },
  { id: '30', name: 'Others' },
];

export default function ProductSelector({ onSelect, onCancel, currentUserId }: ProductSelectorProps) {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<ProductForReport[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  const fetchProducts = async (categoryId: string, pageNum: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryId) params.append('ca_id', categoryId);
      params.append('page', pageNum.toString());
      params.append('limit', '12');

      const response = await fetch(`/api/copyright-report/products?${params}`);
      const data: ProductSearchResponse = await response.json();

      if (data.success) {
        setProducts(data.products);
        setPagination({
          totalPages: data.pagination.totalPages,
          hasNext: data.pagination.hasNext,
          hasPrev: data.pagination.hasPrev,
        });
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(selectedCategory, page);
  }, [selectedCategory, page]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setPage(1);
  };

  return (
    <div className='rounded-lg bg-white p-6 shadow-xl'>
      <h2 className='mb-6 text-2xl font-bold text-gray-900'>저작권 신고할 제품 선택</h2>

      <Tabs value={selectedCategory} onValueChange={handleCategoryChange} className='mb-6'>
        <TabsList className='grid w-full grid-cols-4'>
          {CATEGORIES.map((category) => (
            <TabsTrigger key={category.id} value={category.id}>
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {loading ? (
        <LoadingState message='제품을 불러오는 중...' />
      ) : products.length === 0 ? (
        <EmptyState message='제품이 없습니다.' />
      ) : (
        <>
          <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4'>
            {products.map((product) => {
              const isOwnProduct = product.creator_id === currentUserId;
              const imageUrl = getImageUrl(product.it_img1) || '/images/logo.png';
              
              return (
                <Card
                  key={product.it_id}
                  className={`cursor-pointer overflow-hidden transition-all ${
                    isOwnProduct 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:shadow-lg'
                  }`}
                  onClick={() => !isOwnProduct && onSelect(product)}
                >
                  <div className='aspect-square relative'>
                    <Image
                      src={imageUrl}
                      alt={product.it_name}
                      fill
                      className='object-cover'
                    />
                    {isOwnProduct && (
                      <div className='absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center'>
                        <p className='text-white text-sm font-medium'>내 작품</p>
                      </div>
                    )}
                  </div>
                  <div className='p-3'>
                    <h3 className='font-medium text-sm truncate'>{product.it_name}</h3>
                    <p className='text-xs text-gray-500 truncate'>{product.creator_name}</p>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* 페이지네이션 */}
          {pagination.totalPages > 1 && (
            <div className='mt-6 flex justify-center gap-2'>
              <Button
                variant='outline'
                onClick={() => setPage(page - 1)}
                disabled={!pagination.hasPrev}
              >
                이전
              </Button>
              <span className='flex items-center px-4'>
                {page} / {pagination.totalPages}
              </span>
              <Button
                variant='outline'
                onClick={() => setPage(page + 1)}
                disabled={!pagination.hasNext}
              >
                다음
              </Button>
            </div>
          )}
        </>
      )}

      <div className='mt-6 flex justify-end gap-3'>
        <Button variant='outline' onClick={onCancel}>
          취소
        </Button>
      </div>
    </div>
  );
} 