'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
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
import { ROUTES } from '@/lib/routes';
import {
  Category,
  CategoryFormData,
  CategoryCreateApiResponse,
  CategoryListApiResponse,
} from '@/types/category';
import MessageDialog from '@/components/ui/MessageDialog';

// 상위 카테고리 목록 API 호출
const fetchParentCategories = async (): Promise<Category[]> => {
  const response = await fetch('/api/admin/categories');
  const data: CategoryListApiResponse = await response.json();

  if (!data.success) {
    throw new Error(data.error || '상위 카테고리 목록을 불러오는데 실패했습니다.');
  }

  return data.data?.categories.filter((cat) => cat.level < 5) || []; // 최대 5단계까지만
};

// 카테고리 생성 API 호출
const createCategory = async (data: CategoryFormData): Promise<Category> => {
  const response = await fetch('/api/admin/categories', {
    method: 'POST',
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

  const result: CategoryCreateApiResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error || '카테고리 생성에 실패했습니다.');
  }

  return result.data!;
};

export default function CategoryCreatePage() {
  const router = useRouter();
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    parentId: '',
    order: 1,
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogDescription, setDialogDescription] = useState('');
  const [parentCategories, setParentCategories] = useState<Category[]>([]);

  // 상위 카테고리 목록 로드
  useEffect(() => {
    const loadParentCategories = async () => {
      try {
        const categories = await fetchParentCategories();
        setParentCategories(categories.filter((cat) => cat.level < 5)); // 최대 5단계까지만
      } catch (error) {
        console.error('상위 카테고리 로드 실패:', error);
        showAlert(
          '오류',
          error instanceof Error ? error.message : '상위 카테고리를 불러오는데 실패했습니다.',
        );
      }
    };

    loadParentCategories();
  }, []);

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
      await createCategory(formData);
      showAlert('성공', '카테고리가 성공적으로 생성되었습니다.');

      // 성공 후 목록 페이지로 이동
      setTimeout(() => {
        router.push(ROUTES.ADMIN_CATEGORY);
      }, 1500);
    } catch (error) {
      console.error('카테고리 생성 실패:', error);
      showAlert(
        '오류',
        error instanceof Error ? error.message : '카테고리 생성 중 오류가 발생했습니다.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push(ROUTES.ADMIN_CATEGORY);
  };

  const getNextCategoryId = (parentId?: string): string => {
    if (!parentId || parentId === '') {
      // 1단계 카테고리: 10, 20, 30, ...
      const existingIds = parentCategories
        .filter((cat) => cat.level === 1)
        .map((cat) => parseInt(cat.id))
        .sort((a, b) => a - b);

      let nextId = 10;
      for (const id of existingIds) {
        if (id === nextId) {
          nextId += 10;
        } else {
          break;
        }
      }
      return nextId.toString();
    } else {
      // 하위 카테고리: 부모ID + 10, 20, 30, ...
      const siblingIds = parentCategories
        .filter((cat) => cat.parentId === parentId)
        .map((cat) => parseInt(cat.id.slice(parentId.length)))
        .sort((a, b) => a - b);

      let nextSuffix = 10;
      for (const suffix of siblingIds) {
        if (suffix === nextSuffix) {
          nextSuffix += 10;
        } else {
          break;
        }
      }
      return parentId + nextSuffix.toString().padStart(2, '0');
    }
  };

  const selectedParent = parentCategories.find((cat) => cat.id === formData.parentId);
  const previewId = getNextCategoryId(formData.parentId || undefined);

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
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>카테고리 추가</h1>
          <p className='mt-1 text-gray-600'>새로운 카테고리를 추가합니다.</p>
        </div>
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
                      {parentCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
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
                    placeholder='1'
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

        {/* 미리보기 */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>미리보기</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label className='text-sm font-medium'>카테고리 ID</Label>
                <code className='block rounded bg-gray-100 px-3 py-2 text-sm'>{previewId}</code>
              </div>

              <div className='space-y-2'>
                <Label className='text-sm font-medium'>레벨</Label>
                <div className='rounded bg-blue-100 px-3 py-2 text-sm text-blue-800'>
                  {selectedParent ? selectedParent.level + 1 : 1}단계
                </div>
              </div>

              <div className='space-y-2'>
                <Label className='text-sm font-medium'>전체 경로</Label>
                <div className='rounded bg-gray-50 px-3 py-2 text-sm'>
                  {selectedParent && formData.parentId ? `${selectedParent.name} > ` : ''}
                  {formData.name || '(카테고리명)'}
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
