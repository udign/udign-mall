'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import LoadingSpinner from '@/components/states/LoadingSpinner';
import ErrorState from '@/components/states/ErrorState';
import CommonPagination from '@/components/CommonPagination';
import ProductGrid from '@/components/ProductGrid';
import { PAGINATION_CONFIG } from '@/lib/constants';
import { ROUTES } from '@/lib/routes';

interface SearchProduct {
  it_id: string;
  it_name: string;
  it_basic: string;
  it_cust_price: number;
  it_price: number;
  it_img1: string | null;
  it_img2: string | null;
  it_img3: string | null;
  it_use_avg: number;
  it_use_cnt: number;
  it_hit: number;
  it_time: string;
  it_update_time: string;
  ca_id: string;
  creator_id: string;
  creator_name: string;
  description: string;
  likes_count: string;
  is_liked: boolean;
  current_likes: number;
}

interface SearchResponse {
  success: boolean;
  query: string;
  searchTerms: string[];
  items: SearchProduct[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  error?: string;
}

interface SearchResultsProps {
  searchQuery: string;
}

export default function SearchResults({ searchQuery }: SearchResultsProps) {
  const [searchData, setSearchData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = parseInt(searchParams.get('page') || '1');

  const fetchSearchResults = async (query: string, page: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/search?q=${encodeURIComponent(query)}&page=${page}&limit=${PAGINATION_CONFIG.ITEMS_PER_PAGE}`,
      );
      const data: SearchResponse = await response.json();

      if (data.success) {
        setSearchData(data);
      } else {
        setError(data.error || '검색 중 오류가 발생했습니다.');
      }
    } catch (err) {
      console.error('검색 오류:', err);
      setError('검색 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchQuery?.trim()) {
      if (!searchParams.get('page')) {
        const params = new URLSearchParams();
        params.set('q', searchQuery);
        params.set('page', '1');
        router.replace(`${ROUTES.SEARCH}?${params.toString()}`);
      } else {
        fetchSearchResults(searchQuery.trim(), currentPage);
      }
    }
  }, [searchQuery, currentPage, searchParams, router]);

  return (
    <div className='px-6 py-8 sm:px-10'>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-gray-900'>
          &lsquo;<span className='text-primary'>{searchQuery}</span>&rsquo; 검색 결과
        </h1>
        {!loading && !error && searchData && searchData.items.length > 0 && (
          <p className='mt-2 text-gray-600'>
            총{' '}
            <span className='font-semibold text-gray-900'>{searchData.pagination.totalCount}</span>
            개의 작품이 검색되었습니다.
          </p>
        )}
      </div>

      {loading ? (
        <div className='flex min-h-96 items-center justify-center'>
          <LoadingSpinner size='lg' />
        </div>
      ) : error ? (
        <div className='flex min-h-96 items-center justify-center'>
          <ErrorState message={error} showGoHome={false} />
        </div>
      ) : !searchData || searchData.items.length === 0 ? (
        <div className='flex min-h-96 items-center justify-center'>
          <div className='flex flex-col items-center justify-center py-12 text-center'>
            <Search className='mb-4 h-16 w-16 text-gray-300' />
            <h3 className='mb-2 text-lg font-medium text-gray-900'>검색 결과가 없습니다</h3>
            <p className='text-gray-600'>다른 검색어로 시도해보세요.</p>
          </div>
        </div>
      ) : (
        <>
          <ProductGrid products={searchData.items} className='mb-8' />

          <div className='mt-12 flex justify-center'>
            <CommonPagination
              currentPage={currentPage}
              totalPages={searchData.pagination.totalPages}
              pathname={ROUTES.SEARCH}
              queryParams={{ q: searchQuery }}
            />
          </div>
        </>
      )}
    </div>
  );
}
