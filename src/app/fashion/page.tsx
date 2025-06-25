'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Product, ProductListResponse } from '@/types/product';
import CommonPagination from '@/components/CommonPagination';
import { PAGINATION_CONFIG } from '@/config/pagination';

export default function FashionPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [categoryName, setCategoryName] = useState<string>('');

  const router = useRouter();
  const searchParams = useSearchParams();

  const categoryId = searchParams.get('ca_id') || PAGINATION_CONFIG.DEFAULT_CATEGORY_ID;
  const currentPage = parseInt(searchParams.get('page') || '1');

  const fetchProducts = async (
    pageNum: number = 1,
    catId: string = PAGINATION_CONFIG.DEFAULT_CATEGORY_ID,
  ) => {
    try {
      setLoading(true);

      // 실제 데이터 사용 (데이터베이스에서 가져오기)
      const response = await fetch(
        `/api/products?ca_id=${catId}&page=${pageNum}&limit=${PAGINATION_CONFIG.ITEMS_PER_PAGE}`,
      );

      // 더미 데이터 사용 (테스트용 가짜 데이터)
      // const response = await fetch(
      //   `/api/products/dummy?ca_id=${catId}&page=${pageNum}&limit=${PAGINATION_CONFIG.ITEMS_PER_PAGE}`,
      // );

      if (!response.ok) {
        throw new Error('상품을 불러오는데 실패했습니다.');
      }

      const data: ProductListResponse = await response.json();

      if (data.success) {
        setProducts(data.items);
        setTotalPages(data.pagination.totalPages);
        setCategoryName(data.category.ca_name);
      } else {
        throw new Error('상품 데이터를 처리하는데 실패했습니다.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 초기 로드 시 URL 파라미터가 없으면 기본값으로 설정
    if (!searchParams.get('ca_id') && !searchParams.get('page')) {
      const params = new URLSearchParams();
      params.set('ca_id', PAGINATION_CONFIG.DEFAULT_CATEGORY_ID);
      params.set('page', '1');
      router.replace(`/fashion?${params.toString()}`);
    } else {
      fetchProducts(currentPage, categoryId);
    }
  }, [currentPage, categoryId, searchParams, router]);

  return (
    <div className='px-6 py-5 sm:px-10'>
      {loading ? (
        <div className='container mx-auto'>
          <div className='flex min-h-64 items-center justify-center'>
            <div className='h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600'></div>
          </div>
        </div>
      ) : error ? (
        <div className='container mx-auto'>
          <div className='text-center'>
            <h2 className='mb-4 text-2xl font-bold text-red-600'>오류 발생</h2>
            <p className='mb-4 text-gray-600'>{error}</p>
            <button
              onClick={() => fetchProducts(currentPage, categoryId)}
              className='rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700'
            >
              다시 시도
            </button>
          </div>
        </div>
      ) : (
        <div className='container mx-auto'>
          <div className='mb-8'>
            <h1 className='mb-2 text-3xl font-bold text-gray-900'>{categoryName || '패션'}</h1>
            <p className='text-gray-600'>총 {products.length}개의 작품이 있습니다.</p>
          </div>

          {products.length === 0 ? (
            <div className='py-16 text-center'>
              <p className='text-lg text-gray-500'>등록된 상품이 없습니다.</p>
            </div>
          ) : (
            <>
              <div className='mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
                {products.map((product) => (
                  <Link
                    key={product.it_id}
                    href={`/product/${product.it_id}`}
                    className='block space-y-2 overflow-hidden rounded-lg border border-gray-200 bg-white'
                  >
                    <div className='relative aspect-square'>
                      {product.it_img1 ? (
                        <Image
                          src={product.it_img1}
                          alt={product.it_name}
                          fill
                          className='object-cover'
                          sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw'
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML =
                                '<div class="flex h-full w-full items-center justify-center bg-gray-200"><span class="text-gray-400">이미지 없음</span></div>';
                            }
                          }}
                        />
                      ) : (
                        <div className='flex h-full w-full items-center justify-center bg-gray-200'>
                          <span className='text-gray-400'>이미지 없음</span>
                        </div>
                      )}
                    </div>

                    <div className='p-4'>
                      <h3 className='overflow-hidden font-medium text-gray-900'>
                        {product.it_name}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>

              <CommonPagination
                currentPageNumber={currentPage}
                totalPageCount={totalPages}
                pathname='/fashion'
                queryParams={{ ca_id: categoryId }}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
