'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/primitives/button';
import { Input } from '@/components/ui/primitives/input';
import { Label } from '@/components/ui/primitives/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/primitives/select';
import { Switch } from '@/components/ui/primitives/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/primitives/card';
import { Badge } from '@/components/ui/primitives/badge';
import { ROUTES } from '@/lib/routes';
import {
  Category,
  CategoryFormData,
  CategoryDetailApiResponse,
  CategoryUpdateApiResponse,
  CategoryDeleteApiResponse,
  CategoryListApiResponse,
} from '@/types/category';
import MessageDialog from '@/components/ui/MessageDialog';

// 카테고리 상세 정보 API 호출
const fetchCategory = async (categoryId: string): Promise<Category> => {
  const response = await fetch(`/api/admin/categories/${categoryId}`);
  const data: CategoryDetailApiResponse = await response.json();

  if (!data.success) {
    throw new Error(data.error || '카테고리 정보를 불러오는데 실패했습니다.');
  }

  return data.data!;
};

// 상위 카테고리 목록 API 호출
const fetchParentCategories = async (): Promise<Category[]> => {
  const response = await fetch('/api/admin/categories');
  const data: CategoryListApiResponse = await response.json();

  if (!data.success) {
    throw new Error(data.error || '상위 카테고리 목록을 불러오는데 실패했습니다.');
  }

  return data.data?.categories || [];
};

// 카테고리 수정 API 호출
const updateCategory = async (categoryId: string, data: CategoryFormData): Promise<Category> => {
  const response = await fetch(`/api/admin/categories/${categoryId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: data.name,
      parentId: data.parentId || undefined,
      order: data.order,
      isActive: data.isActive,
    }),
  });

  const result: CategoryUpdateApiResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error || '카테고리 수정에 실패했습니다.');
  }

  return result.data!;
};

// 카테고리 삭제 API 호출
const deleteCategoryById = async (categoryId: string): Promise<void> => {
  const response = await fetch(`/api/admin/categories/${categoryId}`, {
    method: 'DELETE',
  });

  const result: CategoryDeleteApiResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error || '카테고리 삭제에 실패했습니다.');
  }
};

export default function CategoryEditPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id as string;

  const [category, setCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    parentId: '',
    order: 1,
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogDescription, setDialogDescription] = useState('');
  const [parentCategories, setParentCategories] = useState<Category[]>([]);

  useEffect(() => {
    // 카테고리 데이터 로드
    const loadCategory = async () => {
      try {
        // 카테고리 정보와 상위 카테고리 목록을 병렬로 로드
        const [categoryData, allCategories] = await Promise.all([
          fetchCategory(categoryId),
          fetchParentCategories(),
        ]);

        setCategory(categoryData);
        setFormData({
          name: categoryData.name,
          parentId: categoryData.parentId || '',
          order: categoryData.order,
          isActive: categoryData.isActive,
        });

        // 상위 카테고리 목록 설정 (현재 카테고리와 그 하위 카테고리는 제외)
        const availableParents = allCategories.filter(
          (cat) =>
            cat.id !== categoryId &&
            !cat.id.startsWith(categoryId) &&
            cat.level < categoryData.level,
        );
        setParentCategories(availableParents);
      } catch (error) {
        console.error('데이터 로드 실패:', error);
        showAlert(
          '오류',
          error instanceof Error
            ? error.message
            : '카테고리 정보를 불러오는 중 오류가 발생했습니다.',
        );
        router.push(ROUTES.ADMIN_CATEGORY);
      } finally {
        setLoadingData(false);
      }
    };

    if (categoryId) {
      loadCategory();
    }
  }, [categoryId, router]);

  const showAlert = (title: string, description?: string) => {
    setDialogTitle(title);
    setDialogDescription(description || '');
    setShowDialog(true);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '카테고리명을 입력해주세요.';
    } else if (formData.name.length < 2) {
      newErrors.name = '카테고리명은 2글자 이상 입력해주세요.';
    } else if (formData.name.length > 50) {
      newErrors.name = '카테고리명은 50글자 이하로 입력해주세요.';
    }

    if (formData.order !== undefined && (formData.order < 1 || formData.order > 999)) {
      newErrors.order = '순서는 1-999 사이의 숫자를 입력해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await updateCategory(categoryId, formData);
      showAlert('성공', '카테고리가 성공적으로 수정되었습니다.');

      // 성공 후 목록 페이지로 이동
      setTimeout(() => {
        router.push(ROUTES.ADMIN_CATEGORY);
      }, 1500);
    } catch (error) {
      console.error('카테고리 수정 실패:', error);
      showAlert(
        '오류',
        error instanceof Error ? error.message : '카테고리 수정 중 오류가 발생했습니다.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm('정말로 이 카테고리를 삭제하시겠습니까?\n하위 카테고리가 있는 경우 함께 삭제됩니다.')
    ) {
      return;
    }

    setLoading(true);

    try {
      await deleteCategoryById(categoryId);
      showAlert('성공', '카테고리가 성공적으로 삭제되었습니다.');

      // 성공 후 목록 페이지로 이동
      setTimeout(() => {
        router.push(ROUTES.ADMIN_CATEGORY);
      }, 1500);
    } catch (error) {
      console.error('카테고리 삭제 실패:', error);
      showAlert(
        '오류',
        error instanceof Error ? error.message : '카테고리 삭제 중 오류가 발생했습니다.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push(ROUTES.ADMIN_CATEGORY);
  };

  const getFullPath = (category: Category, parentId?: string): string => {
    if (!parentId || parentId === '') {
      return category.name;
    }

    const parent = parentCategories.find((cat) => cat.id === parentId);
    if (parent) {
      return `${parent.name} > ${category.name}`;
    }

    return category.name;
  };

  if (loadingData) {
    return (
      <div className='flex h-64 items-center justify-center'>
        <div className='text-gray-500'>로딩 중...</div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className='flex h-64 items-center justify-center'>
        <div className='text-gray-500'>카테고리를 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* 헤더 */}
      <div className='flex items-center gap-4'>
        <Button
          variant='ghost'
          size='sm'
          onClick={handleCancel}
          className='flex items-center gap-2'
        >
          <ArrowLeft className='h-4 w-4' />
          목록으로
        </Button>
        <div className='flex-1'>
          <h1 className='text-2xl font-bold text-gray-900'>카테고리 수정</h1>
          <p className='mt-1 text-gray-600'>카테고리 정보를 수정합니다.</p>
        </div>
        <Button
          variant='destructive'
          size='sm'
          onClick={handleDelete}
          disabled={loading}
          className='flex items-center gap-2'
        >
          <Trash2 className='h-4 w-4' />
          삭제
        </Button>
      </div>

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        {/* 폼 */}
        <div className='lg:col-span-2'>
          <Card>
            <CardHeader>
              <CardTitle>카테고리 정보</CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
              <form onSubmit={handleSubmit} className='space-y-6'>
                {/* 카테고리 ID (읽기 전용) */}
                <div className='space-y-2'>
                  <Label className='text-sm font-medium'>카테고리 ID</Label>
                  <div className='flex items-center gap-2'>
                    <code className='flex-1 rounded bg-gray-100 px-3 py-2 text-sm'>
                      {category.id}
                    </code>
                    <Badge className='bg-blue-100 text-blue-800'>{category.level}단계</Badge>
                  </div>
                </div>

                {/* 카테고리명 */}
                <div className='space-y-2'>
                  <Label htmlFor='name' className='text-sm font-medium'>
                    카테고리명 <span className='text-red-500'>*</span>
                  </Label>
                  <Input
                    id='name'
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder='카테고리명을 입력하세요'
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && <p className='text-sm text-red-500'>{errors.name}</p>}
                </div>

                {/* 상위 카테고리 */}
                <div className='space-y-2'>
                  <Label htmlFor='parentId' className='text-sm font-medium'>
                    상위 카테고리
                  </Label>
                  <Select
                    value={formData.parentId || 'none'}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, parentId: value === 'none' ? '' : value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='상위 카테고리를 선택하세요 (선택사항)' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='none'>최상위 카테고리</SelectItem>
                      {parentCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 순서 */}
                <div className='space-y-2'>
                  <Label htmlFor='order' className='text-sm font-medium'>
                    출력 순서
                  </Label>
                  <Input
                    id='order'
                    type='number'
                    min='1'
                    max='999'
                    value={formData.order}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        order: parseInt(e.target.value) || 1,
                      }))
                    }
                    className={errors.order ? 'border-red-500' : ''}
                  />
                  {errors.order && <p className='text-sm text-red-500'>{errors.order}</p>}
                  <p className='text-sm text-gray-500'>숫자가 작을수록 먼저 표시됩니다.</p>
                </div>

                {/* 활성 상태 */}
                <div className='flex items-center justify-between'>
                  <div className='space-y-0.5'>
                    <Label htmlFor='isActive' className='text-sm font-medium'>
                      활성 상태
                    </Label>
                    <p className='text-sm text-gray-500'>
                      비활성화하면 사용자에게 표시되지 않습니다.
                    </p>
                  </div>
                  <Switch
                    id='isActive'
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        isActive: checked,
                      }))
                    }
                  />
                </div>

                {/* 버튼 */}
                <div className='flex gap-3 pt-6'>
                  <Button type='submit' disabled={loading} className='flex items-center gap-2'>
                    <Save className='h-4 w-4' />
                    {loading ? '저장 중...' : '저장'}
                  </Button>
                  <Button type='button' variant='outline' onClick={handleCancel} disabled={loading}>
                    취소
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* 현재 정보 */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>현재 정보</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label className='text-sm font-medium'>원래 이름</Label>
                <div className='rounded bg-gray-50 px-3 py-2 text-sm'>{category.name}</div>
              </div>

              <div className='space-y-2'>
                <Label className='text-sm font-medium'>현재 경로</Label>
                <div className='rounded bg-gray-50 px-3 py-2 text-sm'>
                  {getFullPath(category, category.parentId)}
                </div>
              </div>

              <div className='space-y-2'>
                <Label className='text-sm font-medium'>새 경로</Label>
                <div className='rounded bg-blue-50 px-3 py-2 text-sm'>
                  {getFullPath({ ...category, name: formData.name }, formData.parentId)}
                </div>
              </div>

              <div className='space-y-2'>
                <Label className='text-sm font-medium'>상태</Label>
                <div
                  className={`rounded px-3 py-2 text-sm ${
                    formData.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {formData.isActive ? '활성' : '비활성'}
                </div>
              </div>

              {/* 생성일/수정일 */}
              {category.createdAt && (
                <div className='space-y-2'>
                  <Label className='text-sm font-medium'>생성일</Label>
                  <div className='text-sm text-gray-600'>
                    {new Date(category.createdAt).toLocaleDateString('ko-KR')}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
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
