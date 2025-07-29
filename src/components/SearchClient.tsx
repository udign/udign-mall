'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import SearchResults from '@/components/SearchResults';
import LoadingState from '@/components/states/LoadingState';
import ErrorState from '@/components/states/ErrorState';
import { Dictionary } from '@/lib/dictionaries';

interface SearchClientProps {
  dictionary: Dictionary;
}

function SearchContent({ dictionary }: SearchClientProps) {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q');

  return !searchQuery?.trim() ? (
    <div className='px-6 py-8 sm:px-10'>
      <ErrorState
        message={dictionary.search.emptyQuery}
        showGoHome={true}
        dictionary={dictionary}
      />
    </div>
  ) : (
    <SearchResults searchQuery={searchQuery} dictionary={dictionary} />
  );
}

export default function SearchClient({ dictionary }: SearchClientProps) {
  return (
    <Suspense
      fallback={<LoadingState message={dictionary.search.loading} dictionary={dictionary} />}
    >
      <SearchContent dictionary={dictionary} />
    </Suspense>
  );
}
