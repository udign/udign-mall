'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, MoreHorizontal, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/primitives/button';
import { Input } from '@/components/ui/primitives/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/primitives/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/primitives/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/primitives/table';
import { Badge } from '@/components/ui/primitives/badge';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/routes';
import { Category, CategoryFilter, CategoryListApiResponse } from '@/types/category';
import MessageDialog from '@/components/ui/MessageDialog';

// 카테고리 목록 API 호출
const fetchCategories = async (filter: CategoryFilter = {}): Promise<Category[]> => {
  const params = new URLSearchParams();

  if (filter.search) params.append('search', filter.search);
  if (filter.isActive !== undefined) params.append('isActive', filter.isActive.toString());
  if (filter.level) params.append('level', filter.level.toString());

  const response = await fetch(`/api/admin/categories?${params}`);
  const data: CategoryListApiResponse = await response.json();

  if (!data.success) {
    throw new Error(data.error || '카테고리 목록을 불러오는데 실패했습니다.');
  }

  return data.data?.categories || [];
};

// 카테고리 활성 상태 변경 API
const toggleCategoryActive = async (categoryId: string, isActive: boolean): Promise<void> => {
  const response = await fetch(`/api/admin/categories/${categoryId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ isActive: !isActive }),
  });

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || '카테고리 상태 변경에 실패했습니다.');
  }
};

// 카테고리 삭제 API
const deleteCategory = async (categoryId: string): Promise<void> => {
  const response = await fetch(`/api/admin/categories/${categoryId}`, {
    method: 'DELETE',
  });

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || '카테고리 삭제에 실패했습니다.');
  }
};

export default function CategoryManagePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<CategoryFilter>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogDescription, setDialogDescription] = useState('');

  const showAlert = useCallback((title: string, description?: string) => {
    setDialogTitle(title);
    setDialogDescription(description || '');
    setShowDialog(true);
  }, []);

  // 카테고리 목록 로드
  const loadCategories = useCallback(
    async (currentFilter: CategoryFilter = {}) => {
      try {
        setLoading(true);
        const data = await fetchCategories(currentFilter);
        setCategories(data);
      } catch (error) {
        console.error('카테고리 로드 실패:', error);
        showAlert(
          '오류',
          error instanceof Error ? error.message : '카테고리를 불러오는데 실패했습니다.',
        );
      } finally {
        setLoading(false);
      }
    },
    [showAlert],
  );

  // 초기 로드 및 필터 변경시 재로드
  useEffect(() => {
    loadCategories(filter);
  }, [filter, loadCategories]);

  const handleCreateCategory = () => {
    router.push(ROUTES.ADMIN_CATEGORY_CREATE);
  };

  const handleEditCategory = (categoryId: string) => {
    router.push(`${ROUTES.ADMIN_CATEGORY_EDIT}/${categoryId}`);
  };

  const handleToggleActive = useCallback(
    async (categoryId: string, isActive: boolean) => {
      try {
        await toggleCategoryActive(categoryId, isActive);
        showAlert('성공', '카테고리 활성 상태가 변경되었습니다.');
        // 목록 새로고침
        await loadCategories(filter);
      } catch (error) {
        console.error('상태 변경 실패:', error);
        showAlert('오류', error instanceof Error ? error.message : '상태 변경에 실패했습니다.');
      }
    },
    [filter, loadCategories, showAlert],
  );

  const handleDeleteCategory = useCallback(
    async (categoryId: string) => {
      if (confirm('정말로 이 카테고리를 삭제하시겠습니까?')) {
        try {
          await deleteCategory(categoryId);
          showAlert('성공', '카테고리가 삭제되었습니다.');
          // 목록 새로고침
          await loadCategories(filter);
        } catch (error) {
          console.error('삭제 실패:', error);
          showAlert('오류', error instanceof Error ? error.message : '삭제에 실패했습니다.');
        }
      }
    },
    [filter, loadCategories, showAlert],
  );

  // 검색어 변경 핸들러
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setFilter((prev) => ({ ...prev, search: value || undefined }));
  };

  const getLevelBadgeColor = (level: number) => {
    switch (level) {
      case 1:
        return 'bg-blue-100 text-blue-800';
      case 2:
        return 'bg-green-100 text-green-800';
      case 3:
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getIndentation = (level: number) => {
    return `${(level - 1) * 20}px`;
  };

  if (loading) {
    return (
      <div className='flex h-64 items-center justify-center'>
        <div className='text-gray-500'>로딩 중...</div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* 헤더 */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>카테고리 관리</h1>
          <p className='mt-1 text-gray-600'>
            쇼핑몰 카테고리를 관리하고 구조를 설정할 수 있습니다.
          </p>
        </div>
        <Button onClick={handleCreateCategory} className='flex items-center gap-2'>
          <Plus className='h-4 w-4' />
          카테고리 추가
        </Button>
      </div>

      {/* 필터 및 검색 */}
      <div className='flex items-center gap-4 rounded-lg border bg-white p-4'>
        <div className='flex-1'>
          <div className='relative'>
            <Search className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400' />
            <Input
              placeholder='카테고리명으로 검색...'
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className='pl-10'
            />
          </div>
        </div>
        <Select
          value={filter.level?.toString() || 'all'}
          onValueChange={(value) =>
            setFilter((prev) => ({ ...prev, level: value === 'all' ? undefined : parseInt(value) }))
          }
        >
          <SelectTrigger className='w-32'>
            <SelectValue placeholder='레벨' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>전체</SelectItem>
            <SelectItem value='1'>1단계</SelectItem>
            <SelectItem value='2'>2단계</SelectItem>
            <SelectItem value='3'>3단계</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filter.isActive?.toString() || 'all'}
          onValueChange={(value) =>
            setFilter((prev) => ({
              ...prev,
              isActive: value === 'all' ? undefined : value === 'true',
            }))
          }
        >
          <SelectTrigger className='w-32'>
            <SelectValue placeholder='상태' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>전체</SelectItem>
            <SelectItem value='true'>활성</SelectItem>
            <SelectItem value='false'>비활성</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 카테고리 테이블 */}
      <div className='rounded-lg border bg-white'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>카테고리명</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>레벨</TableHead>
              <TableHead>순서</TableHead>
              <TableHead>상태</TableHead>
              <TableHead className='text-right'>작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>
                  <div
                    className='flex items-center gap-2'
                    style={{ paddingLeft: getIndentation(category.level) }}
                  >
                    <span className='font-medium'>{category.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <code className='rounded bg-gray-100 px-2 py-1 text-sm'>{category.id}</code>
                </TableCell>
                <TableCell>
                  <Badge className={getLevelBadgeColor(category.level)}>{category.level}단계</Badge>
                </TableCell>
                <TableCell>{category.order}</TableCell>
                <TableCell>
                  {category.isActive ? (
                    <Badge className='bg-green-100 text-green-800'>활성</Badge>
                  ) : (
                    <Badge className='bg-red-100 text-red-800'>비활성</Badge>
                  )}
                </TableCell>
                <TableCell className='text-right'>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant='ghost' size='sm'>
                        <MoreHorizontal className='h-4 w-4' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuItem onClick={() => handleEditCategory(category.id)}>
                        <Edit className='mr-2 h-4 w-4' />
                        수정
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleToggleActive(category.id, category.isActive)}
                      >
                        {category.isActive ? (
                          <>
                            <EyeOff className='mr-2 h-4 w-4' />
                            비활성화
                          </>
                        ) : (
                          <>
                            <Eye className='mr-2 h-4 w-4' />
                            활성화
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteCategory(category.id)}
                        className='text-red-600'
                      >
                        <Trash2 className='mr-2 h-4 w-4' />
                        삭제
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {categories.length === 0 && !loading && (
          <div className='py-8 text-center text-gray-500'>
            {filter.search || filter.level || filter.isActive !== undefined
              ? '검색 조건에 맞는 카테고리가 없습니다.'
              : '카테고리가 없습니다. 첫 번째 카테고리를 추가해보세요.'}
          </div>
        )}
      </div>

      <MessageDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        title={dialogTitle}
        description={dialogDescription}
      />
    </div>
  );
}
