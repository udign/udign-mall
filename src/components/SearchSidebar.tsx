'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Search } from 'lucide-react';
import { Button } from '@/components/ui/primitives/button';
import { Input } from '@/components/ui/primitives/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/primitives/sheet';
import { Dictionary } from '@/lib/dictionaries';

interface SearchSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  dictionary: Dictionary;
}

export default function SearchSidebar({ isOpen, onClose, dictionary }: SearchSidebarProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');

  const router = useRouter();

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/shop/search?q=${encodeURIComponent(searchQuery.trim())}`);
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side='top' className='w-full p-0 [&>button]:hidden'>
        <SheetHeader className='sr-only'>
          <SheetTitle>{dictionary.sidebar.search.title}</SheetTitle>
          <SheetDescription>{dictionary.sidebar.search.description}</SheetDescription>
        </SheetHeader>

        <div className='flex h-full flex-col'>
          <div className='border-b px-6 py-8 sm:px-10'>
            <div className='mb-4 flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Search className='h-5 w-5 text-gray-600' />
                <h2 className='text-lg font-semibold'>{dictionary.sidebar.search.title}</h2>
              </div>
              <Button variant='ghost' size='sm' onClick={onClose}>
                <X className='h-4 w-4' />
              </Button>
            </div>

            <div className='flex gap-2'>
              <Input
                type='text'
                placeholder={dictionary.sidebar.search.placeholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className='h-12 flex-1 text-base'
                autoFocus
              />
              <Button
                onClick={handleSearch}
                className='h-12 bg-black px-6 text-white hover:bg-gray-800'
              >
                {dictionary.sidebar.search.button}
              </Button>
            </div>
          </div>

          <div className='flex-1 p-4'>
            <div className='text-center text-sm text-gray-500'>
              <p>{dictionary.sidebar.search.hint}</p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
