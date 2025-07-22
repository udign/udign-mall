'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/primitives/card';
import { Button } from '@/components/ui/primitives/button';
import { Input } from '@/components/ui/primitives/input';
import { Label } from '@/components/ui/primitives/label';
import { Switch } from '@/components/ui/primitives/switch';
import { Plus, Trash2, Save } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { MEMBER_LEVELS } from '@/lib/constants';
import LoadingState from '@/components/states/LoadingState';
import ErrorState from '@/components/states/ErrorState';
import MessageDialog from '@/components/ui/MessageDialog';

interface SizeGuideItem {
  id?: number;
  area?: string;
  size_s?: string;
  size_m?: string;
  size_l?: string;
  sort_order: number;
  is_active?: boolean;
  tempId?: string; // 새로 추가된 아이템을 위한 임시 ID
}

export default function SizeGuideManagePage() {
  const [sizeGuideData, setSizeGuideData] = useState<SizeGuideItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState<boolean>(false);
  const [tempIdCounter, setTempIdCounter] = useState<number>(0);

  const { user, isLoading: authLoading } = useAuth();

  // 관리자 권한 확인
  const isAdmin = user && user.mb_level >= MEMBER_LEVELS.ADMIN;

  useEffect(() => {
    if (!authLoading) {
      if (!isAdmin) {
        setError('관리자 권한이 필요합니다.');
        return;
      }
      fetchSizeGuideData();
    }
  }, [authLoading, isAdmin]);

  const fetchSizeGuideData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/size-guide');
      const result = await response.json();

      if (result.success) {
        setSizeGuideData(result.data);
      } else {
        setError(result.error || '데이터를 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('사이즈 가이드 조회 오류:', error);
      setError('서버 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    index: number,
    field: keyof SizeGuideItem,
    value: string | boolean,
  ) => {
    setSizeGuideData((prev) => {
      const newData = [...prev];
      newData[index] = { ...newData[index], [field]: value };
      return newData;
    });
  };

  const addNewItem = () => {
    const newItem: SizeGuideItem = {
      tempId: `temp_${tempIdCounter}`,
      area: '',
      size_s: '',
      size_m: '',
      size_l: '',
      sort_order: sizeGuideData.length + 1,
      is_active: true,
    };
    setSizeGuideData((prev) => [...prev, newItem]);
    setTempIdCounter((prev) => prev + 1);
  };

  const removeItem = (index: number) => {
    setSizeGuideData((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // 기본 유효성 검사 (측정 부위만 필수)
      const isValid = sizeGuideData.every((item) => item.area?.trim());

      if (!isValid) {
        setError('측정 부위는 필수 입력 항목입니다.');
        return;
      }

      // tempId 제거 및 순서 정리
      const dataToSave = sizeGuideData.map((item, index) => ({
        area: item.area?.trim() || '',
        size_s: item.size_s?.trim() || '',
        size_m: item.size_m?.trim() || '',
        size_l: item.size_l?.trim() || '',
        sort_order: index + 1,
        is_active: item.is_active ?? true,
      }));

      const response = await fetch('/api/admin/size-guide', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: dataToSave }),
      });

      const result = await response.json();

      if (result.success) {
        setShowSuccessDialog(true);
        await fetchSizeGuideData(); // 저장 후 새로운 데이터로 업데이트
      } else {
        setError(result.error || '저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('사이즈 가이드 저장 오류:', error);
      setError('서버 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return <LoadingState message='사이즈 가이드 정보를 불러오는 중...' />;
  }

  if (error) {
    return <ErrorState message={error} showGoHome={!isAdmin} />;
  }

  return (
    <div>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-gray-900'>사이즈 가이드 관리</h1>
        <p className='mt-2 text-sm text-gray-600'>
          쇼핑몰에서 고객들이 보는 사이즈 가이드 정보를 관리할 수 있습니다.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center justify-between'>
            <span>사이즈 정보</span>
            <div className='flex gap-2'>
              <Button onClick={addNewItem} variant='outline' size='sm'>
                <Plus className='h-4 w-4' />
                항목 추가
              </Button>
              <Button onClick={handleSave} disabled={saving} size='sm'>
                {saving ? '저장 중...' : '저장'}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {sizeGuideData.length === 0 ? (
              <div className='py-8 text-center text-gray-500'>
                사이즈 가이드 항목이 없습니다. 새 항목을 추가해주세요.
              </div>
            ) : (
              <div className='grid gap-4'>
                {sizeGuideData.map((item, index) => (
                  <div
                    key={item.id || item.tempId}
                    className='flex items-center gap-4 rounded-lg border bg-gray-50 p-4'
                  >
                    <div className='grid flex-1 grid-cols-1 items-center gap-4 md:grid-cols-5'>
                      <div>
                        <Label htmlFor={`area-${index}`} className='text-xs text-gray-600'>
                          측정 부위
                        </Label>
                        <Input
                          id={`area-${index}`}
                          value={item.area}
                          onChange={(e) => handleInputChange(index, 'area', e.target.value)}
                          placeholder='예: A - 가슴 둘레'
                          className='mt-1 bg-white'
                        />
                      </div>

                      <div>
                        <Label htmlFor={`size-s-${index}`} className='text-xs text-gray-600'>
                          S 사이즈 (cm)
                        </Label>
                        <Input
                          id={`size-s-${index}`}
                          value={item.size_s}
                          onChange={(e) => handleInputChange(index, 'size_s', e.target.value)}
                          placeholder='56.5'
                          className='mt-1 bg-white'
                        />
                      </div>

                      <div>
                        <Label htmlFor={`size-m-${index}`} className='text-xs text-gray-600'>
                          M 사이즈 (cm)
                        </Label>
                        <Input
                          id={`size-m-${index}`}
                          value={item.size_m}
                          onChange={(e) => handleInputChange(index, 'size_m', e.target.value)}
                          placeholder='59.0'
                          className='mt-1 bg-white'
                        />
                      </div>

                      <div>
                        <Label htmlFor={`size-l-${index}`} className='text-xs text-gray-600'>
                          L 사이즈 (cm)
                        </Label>
                        <Input
                          id={`size-l-${index}`}
                          value={item.size_l}
                          onChange={(e) => handleInputChange(index, 'size_l', e.target.value)}
                          placeholder='61.5'
                          className='mt-1 bg-white'
                        />
                      </div>

                      <div className='flex items-center gap-4'>
                        <div className='flex items-center space-x-2'>
                          <Switch
                            className='cursor-pointer'
                            id={`active-${index}`}
                            checked={item.is_active}
                            onCheckedChange={(checked: boolean) =>
                              handleInputChange(index, 'is_active', checked)
                            }
                          />
                          <Label htmlFor={`active-${index}`} className='text-xs text-gray-600'>
                            활성
                          </Label>
                        </div>
                        <Button
                          onClick={() => removeItem(index)}
                          variant='ghost'
                          size='sm'
                          className='text-red-600 hover:bg-red-50 hover:text-red-700'
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className='mt-6 rounded-lg bg-blue-50 p-4'>
              <h4 className='mb-2 text-sm font-medium text-blue-900'>💡 사용 안내</h4>
              <ul className='space-y-1 text-xs text-blue-800'>
                <li>• 측정 부위는 필수 입력 항목입니다</li>
                <li>• 사이즈 값은 선택적으로 입력 가능하며, 빈 값은 &quot;-&quot;로 표시됩니다</li>
                <li>• 활성 스위치를 해제하면 고객에게 표시되지 않습니다</li>
                <li>• 모든 변경사항은 저장 버튼을 눌러야 적용됩니다</li>
                <li>• 측정값은 cm 단위로 소수점까지 입력 가능합니다</li>
                <li>• 항목 순서는 표시된 순서대로 저장됩니다</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <MessageDialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        title='저장 완료'
        description='사이즈 가이드가 성공적으로 업데이트되었습니다.'
        confirmText='확인'
      />
    </div>
  );
}
