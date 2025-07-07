'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import SearchResults from '@/components/SearchResults';
import LoadingState from '@/components/states/LoadingState';
import ErrorState from '@/components/states/ErrorState';

function SearchContent() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q');

  return !searchQuery?.trim() ? (
    <div className='px-6 py-8 sm:px-10'>
      <ErrorState message='검색어를 입력해주세요.' showGoHome={true} />
    </div>
  ) : (
    <SearchResults searchQuery={searchQuery} />
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<LoadingState message='검색 결과를 불러오는 중...' />}>
      <SearchContent />
    </Suspense>
  );
}
