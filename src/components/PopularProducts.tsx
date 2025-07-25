'use client';

import { useState, useEffect } from 'react';
import ProductGrid from '@/components/ProductGrid';

interface ApiPopularProduct {
  it_id: string;
  it_name: string;
  it_img1: string;
  it_price: number;
  it_cust_price: number;
  it_hit: number;
  creator_name: string;
  description: string;
  target_likes: number;
  current_likes: number;
  ca_name: string;
}

interface PopularProduct {
  it_id: string;
  it_name: string;
  it_img1: string;
  it_price: number;
  it_cust_price: number;
  it_hit: number;
  creator_name: string;
  description: string;
  target_likes: number;
  current_likes: number;
  ca_name: string;
  it_basic: string;
  it_img2: string | null;
  it_img3: string | null;
  it_use_avg: number;
  it_use_cnt: number;
  it_time: string;
  it_update_time: string;
  ca_id: string;
  creator_id: string;
  likes_count: string;
  is_liked: boolean;
}

interface PopularProductsProps {
  excludeProductId?: string; // 현재 상품은 제외
}

export default function PopularProducts({ excludeProductId }: PopularProductsProps) {
  const [products, setProducts] = useState<PopularProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPopularProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/products/popular');
        const data = await response.json();

        if (data.success) {
          // 현재 상품 제외하고 최대 4개까지 표시
          let filteredProducts: ApiPopularProduct[] = data.products;
          if (excludeProductId) {
            filteredProducts = data.products.filter(
              (product: ApiPopularProduct) => product.it_id !== excludeProductId,
            );
          }

          // ProductGrid에서 사용하는 형태로 데이터 변환
          const formattedProducts = filteredProducts
            .slice(0, 4)
            .map((product: ApiPopularProduct) => ({
              it_id: product.it_id,
              it_name: product.it_name,
              it_basic: product.description || '',
              it_cust_price: product.it_cust_price,
              it_price: product.it_price,
              it_img1: product.it_img1,
              it_img2: null,
              it_img3: null,
              it_use_avg: 0,
              it_use_cnt: 0,
              it_hit: product.it_hit,
              it_time: '',
              it_update_time: '',
              ca_id: '',
              creator_id: '',
              creator_name: product.creator_name,
              description: product.description || '',
              likes_count: product.current_likes.toString(),
              is_liked: false,
              current_likes: product.current_likes,
              target_likes: product.target_likes,
              ca_name: product.ca_name,
              it_4: 'it_4' in product ? product.it_4 : product.target_likes, // 블러 처리를 위한 it_4
              _status_text: '_status_text' in product ? product._status_text : '컬렉션', // 상태 정보
            }));

          setProducts(formattedProducts);
        } else {
          setError(data.error || '인기 작품을 불러오는데 실패했습니다.');
        }
      } catch (err) {
        setError('서버 오류가 발생했습니다.');
        console.error('인기 작품 조회 오류:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPopularProducts();
  }, [excludeProductId]);

  return loading ? (
    <div className='mt-12 border-t border-gray-200 pt-8'>
      <h2 className='mb-6 text-xl font-bold text-gray-900'>인기 작품</h2>
      <div className='grid grid-cols-2 gap-6 md:grid-cols-4'>
        {[...Array(4)].map((_, index) => (
          <div key={index} className='animate-pulse'>
            <div className='mb-3 aspect-square rounded-lg bg-gray-200'></div>
            <div className='mb-2 h-4 rounded bg-gray-200'></div>
            <div className='mb-1 h-3 rounded bg-gray-200'></div>
            <div className='h-3 w-3/4 rounded bg-gray-200'></div>
          </div>
        ))}
      </div>
    </div>
  ) : error || products.length === 0 ? null : (
    <div className='mt-12 border-t border-gray-200 pt-8'>
      <h2 className='mb-6 text-xl font-bold text-gray-900'>인기 작품</h2>
      <ProductGrid products={products} className='grid-cols-2 md:grid-cols-4' />
    </div>
  );
}
