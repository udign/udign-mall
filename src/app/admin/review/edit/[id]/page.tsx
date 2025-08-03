'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/primitives/button';
import { Input } from '@/components/ui/primitives/input';
import { Label } from '@/components/ui/primitives/label';
import { Textarea } from '@/components/ui/primitives/textarea';
import { Checkbox } from '@/components/ui/primitives/checkbox';
import { Switch } from '@/components/ui/primitives/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/primitives/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/primitives/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/primitives/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/primitives/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/primitives/form';
import { ArtworkDetail } from '@/types/artwork';
import { Category } from '@/types/category';
import { ArrowLeft, Plus, Trash2, Heart } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/primitives/dropdown-menu';
import LoadingSpinner from '@/components/states/LoadingSpinner';
import ArtworkImageUploadItem from '@/components/ArtworkImageUploadItem';
import MessageDialog from '@/components/ui/MessageDialog';
import { ROUTES } from '@/lib/routes';

type ArtworkFormData = z.infer<typeof artworkFormSchema>;

interface UserInfo {
  mb_id: string;
  mb_name: string;
  mb_email: string;
  mb_hp?: string;
  mb_level: number;
  mb_datetime: string;
  mb_today_login?: string;
  mb_memo?: string;
}

interface OptionItem {
  id: string;
  value: string;
  stock_qty: number;
  price_add: number;
  use_yn: 'Y' | 'N';
}

interface OptionGroup {
  id: string;
  option_name: string;
  items: OptionItem[];
}

const OptionGroupComponent = React.memo(
  ({
    group,
    groupIndex,
    onRemoveGroup,
    onUpdateGroupName,
    onAddOptionItem,
    onRemoveOptionItem,
    onUpdateOptionItem,
  }: {
    group: OptionGroup;
    groupIndex: number;
    onRemoveGroup: (index: number) => void;
    onUpdateGroupName: (groupIndex: number, name: string) => void;
    onAddOptionItem: (groupIndex: number) => void;
    onRemoveOptionItem: (groupIndex: number, itemIndex: number) => void;
    onUpdateOptionItem: (
      groupIndex: number,
      itemIndex: number,
      field: keyof OptionItem,
      value: string | number,
    ) => void;
  }) => {
    return (
      <div className='rounded-lg border border-gray-200 p-4'>
        <div className='mb-4 flex items-center justify-between'>
          <div className='flex items-center space-x-4'>
            <Input
              value={group.option_name}
              onChange={(e) => onUpdateGroupName(groupIndex, e.target.value)}
              placeholder='옵션명 (예: 사이즈, 색상)'
              className='w-48'
            />
            <Button
              type='button'
              onClick={() => onAddOptionItem(groupIndex)}
              size='sm'
              variant='outline'
            >
              <Plus className='mr-1 h-3 w-3' />
              옵션 추가
            </Button>
          </div>
          <Button
            type='button'
            onClick={() => onRemoveGroup(groupIndex)}
            size='sm'
            variant='outline'
            className='text-red-600 hover:text-red-700'
          >
            <Trash2 className='h-4 w-4' />
          </Button>
        </div>

        {group.items.length === 0 ? (
          <div className='py-4 text-center text-sm text-gray-500'>
            옵션이 없습니다. &ldquo;옵션 추가&rdquo; 버튼을 클릭해주세요.
          </div>
        ) : (
          <div className='space-y-3'>
            <div className='grid grid-cols-5 gap-4 rounded bg-gray-50 p-2 text-xs font-medium text-gray-600'>
              <div>옵션값</div>
              <div>판매수량</div>
              <div>추가금액</div>
              <div>사용여부</div>
              <div>관리</div>
            </div>
            {group.items.map((item, itemIndex) => (
              <div key={item.id} className='grid grid-cols-5 gap-4 rounded border bg-white p-2'>
                <Input
                  value={item.value}
                  onChange={(e) =>
                    onUpdateOptionItem(groupIndex, itemIndex, 'value', e.target.value)
                  }
                  placeholder='옵션값 (예: S, 빨강)'
                />
                <Input
                  type='number'
                  value={item.stock_qty}
                  onChange={(e) =>
                    onUpdateOptionItem(
                      groupIndex,
                      itemIndex,
                      'stock_qty',
                      parseInt(e.target.value) || 0,
                    )
                  }
                  placeholder='수량'
                />
                <Input
                  type='number'
                  value={item.price_add}
                  onChange={(e) =>
                    onUpdateOptionItem(
                      groupIndex,
                      itemIndex,
                      'price_add',
                      parseInt(e.target.value) || 0,
                    )
                  }
                  placeholder='추가금액'
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='outline' size='sm' className='w-full justify-between text-xs'>
                      {item.use_yn === 'Y' ? '사용함' : '사용안함'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      onClick={() => onUpdateOptionItem(groupIndex, itemIndex, 'use_yn', 'Y')}
                    >
                      사용함
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onUpdateOptionItem(groupIndex, itemIndex, 'use_yn', 'N')}
                    >
                      사용안함
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <div>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => onRemoveOptionItem(groupIndex, itemIndex)}
                    className='text-red-600 hover:text-red-700'
                  >
                    <Trash2 className='h-3 w-3' />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  },
);

OptionGroupComponent.displayName = 'OptionGroupComponent';

const ARTWORK_IMAGE_INDICES = [1, 2, 3, 4] as const;

const artworkFormSchema = z.object({
  it_name: z.string().min(1, '디자인명을 입력해주세요.'),
  it_1: z.string(),
  it_3: z.string(),
  it_4: z.number().min(0),
  it_price: z.number().min(0),
  it_order: z.number(),
  it_use: z.number().min(0).max(1),
  it_soldout: z.number().min(0).max(1),
  it_point: z.number().min(0),
  it_point_type: z.number().min(0).max(2),
  it_supply_point: z.number().min(0),
  it_stock_qty: z.number().min(0),
  it_stock_sms: z.number().min(0).max(1),
  it_noti_qty: z.number().min(0),
  it_buy_min_qty: z.number().min(0),
  it_buy_max_qty: z.number().min(0),
  it_notax: z.number().min(0).max(1),
  it_sell_email: z.string(),
  it_nocoupon: z.number().min(0).max(1),
  ca_id: z.string().min(1, '기본분류를 선택해주세요.'),
  ca_id2: z.string(),
  ca_id3: z.string(),
  ca_id4: z.string(),
  it_sc_type: z.number().min(0).max(4),
  it_sc_method: z.number().min(0).max(2),
  it_sc_price: z.number().min(0),
  it_sc_minimum: z.number().min(0),
  it_sc_qty: z.number().min(0),
});

export default function ArtworkEditPage() {
  const [artwork, setArtwork] = useState<ArtworkDetail | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [imageFiles, setImageFiles] = useState<{ [key: string]: File | null }>({});
  const [imagePreview, setImagePreview] = useState<{ [key: string]: string }>({});
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>([]);

  // MessageDialog states
  const [showRequiredImageDialog, setShowRequiredImageDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [showLoadErrorDialog, setShowLoadErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Toggle states
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [currentLikes, setCurrentLikes] = useState(0);
  const [targetLikes, setTargetLikes] = useState(0);

  // Tab state
  const [activeTab, setActiveTab] = useState('home');

  // User info modal states
  const [showUserInfoModal, setShowUserInfoModal] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [userInfoLoading, setUserInfoLoading] = useState(false);

  const params = useParams();
  const router = useRouter();
  const artworkId = params.id as string;

  const form = useForm<ArtworkFormData>({
    resolver: zodResolver(artworkFormSchema),
    defaultValues: {
      it_name: '',
      it_1: '',
      it_3: '',
      it_4: 0,
      it_price: 0,
      it_order: 0,
      it_use: 1,
      it_soldout: 0,
      it_point: 0,
      it_point_type: 0,
      it_supply_point: 0,
      it_stock_qty: 0,
      it_stock_sms: 0,
      it_noti_qty: 0,
      it_buy_min_qty: 0,
      it_buy_max_qty: 0,
      it_notax: 0,
      it_sell_email: '',
      it_nocoupon: 0,
      ca_id: '',
      ca_id2: '',
      ca_id3: '',
      ca_id4: '',
      it_sc_type: 0,
      it_sc_method: 0,
      it_sc_price: 0,
      it_sc_minimum: 0,
      it_sc_qty: 0,
    },
  });

  // 리렌더링 트리거 필드: 카테고리(ca_id, ca_id2, ca_id3, ca_id4), 포인트유형(it_point_type), 배송비유형(it_sc_type) 변경 시에만 리렌더링
  const watchedFields = form.watch([
    'ca_id',
    'ca_id2',
    'ca_id3',
    'ca_id4',
    'it_point_type',
    'it_sc_type',
  ]);
  const [ca_id, ca_id2, ca_id3, ca_id4, it_point_type, it_sc_type] = watchedFields;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [artworkRes, categoriesRes] = await Promise.all([
          fetch(`/api/admin/artwork/${artworkId}`),
          fetch('/api/admin/categories'),
        ]);

        if (!artworkRes.ok) {
          throw new Error('디자인 정보를 불러올 수 없습니다.');
        }

        const artworkData = await artworkRes.json();

        // 카테고리 API 응답 처리 수정
        let categoriesData = [];
        if (categoriesRes.ok) {
          const response = await categoriesRes.json();
          categoriesData = response.success ? response.data?.categories || [] : [];
        }

        setArtwork(artworkData);
        setCategories(categoriesData);

        // 좋아요 수 초기화
        setCurrentLikes(artworkData._iCount || 0);
        setTargetLikes(parseInt(artworkData.it_4) || 0);

        // 카테고리 정보 자동 보완
        const ca_id = artworkData.ca_id || '';
        const ca_id2 = artworkData.ca_id2 || '';
        const ca_id3 = artworkData.ca_id3 || '';
        const ca_id4 = artworkData.ca_id4 || '';

        // 하위 카테고리가 있지만 상위 카테고리가 없는 경우 자동 보완
        let finalCaId = ca_id;
        let finalCaId2 = ca_id2;
        let finalCaId3 = ca_id3;
        const finalCaId4 = ca_id4;

        // 4차 카테고리가 있지만 3차가 없는 경우
        if (ca_id4 && !ca_id3 && ca_id4.length >= 6) {
          finalCaId3 = ca_id4.substring(0, 6);
        }

        // 3차 카테고리가 있지만 2차가 없는 경우
        if ((finalCaId3 || ca_id3) && !ca_id2 && (finalCaId3 || ca_id3).length >= 4) {
          finalCaId2 = (finalCaId3 || ca_id3).substring(0, 4);
        }

        // 2차 카테고리가 있지만 1차가 없는 경우
        if ((finalCaId2 || ca_id2) && !ca_id && (finalCaId2 || ca_id2).length >= 2) {
          finalCaId = (finalCaId2 || ca_id2).substring(0, 2);
        }

        // React Hook Form에 기본값 설정
        form.reset({
          it_name: artworkData.it_name || '',
          it_1: artworkData.it_1 || '',
          it_3: artworkData.it_3 || '',
          it_4: parseInt(artworkData.it_4) || 0,
          it_price: parseInt(artworkData.it_price) || 0,
          it_order: parseInt(artworkData.it_order) || 0,
          it_use: parseInt(artworkData.it_use) || 1,
          it_soldout: parseInt(artworkData.it_soldout) || 0,
          it_point: parseInt(artworkData.it_point) || 0,
          it_point_type: parseInt(artworkData.it_point_type) || 0,
          it_supply_point: parseInt(artworkData.it_supply_point) || 0,
          it_stock_qty: parseInt(artworkData.it_stock_qty) || 0,
          it_stock_sms: parseInt(artworkData.it_stock_sms) || 0,
          it_noti_qty: parseInt(artworkData.it_noti_qty) || 0,
          it_buy_min_qty: parseInt(artworkData.it_buy_min_qty) || 0,
          it_buy_max_qty: parseInt(artworkData.it_buy_max_qty) || 0,
          it_notax: parseInt(artworkData.it_notax) || 0,
          it_sell_email: artworkData.it_sell_email || '',
          it_nocoupon: parseInt(artworkData.it_nocoupon) || 0,
          ca_id: finalCaId,
          ca_id2: finalCaId2,
          ca_id3: finalCaId3,
          ca_id4: finalCaId4,
          it_sc_type: parseInt(artworkData.it_sc_type) || 0,
          it_sc_method: parseInt(artworkData.it_sc_method) || 0,
          it_sc_price: parseInt(artworkData.it_sc_price) || 0,
          it_sc_minimum: parseInt(artworkData.it_sc_minimum) || 0,
          it_sc_qty: parseInt(artworkData.it_sc_qty) || 0,
        });

        setOptionGroups(artworkData.optionGroups || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        setErrorMessage('데이터를 불러오는 중 오류가 발생했습니다.');
        setShowLoadErrorDialog(true);
      } finally {
        setLoading(false);
      }
    };

    if (artworkId) {
      fetchData();
    }
  }, [artworkId, form]);

  // 카테고리 변경 핸들러 (하위 카테고리 초기화 포함)
  const handleCategoryChange = useCallback(
    (field: 'ca_id' | 'ca_id2' | 'ca_id3' | 'ca_id4', value: string) => {
      form.setValue(field, value);

      // 1차 카테고리 변경 시 2차, 3차, 4차 초기화
      if (field === 'ca_id') {
        form.setValue('ca_id2', '');
        form.setValue('ca_id3', '');
        form.setValue('ca_id4', '');
      }
      // 2차 카테고리 변경 시 3차, 4차 초기화
      else if (field === 'ca_id2') {
        form.setValue('ca_id3', '');
        form.setValue('ca_id4', '');
      }
      // 3차 카테고리 변경 시 4차 초기화
      else if (field === 'ca_id3') {
        form.setValue('ca_id4', '');
      }
    },
    [form],
  );

  const handleImageUpload = useCallback((imageIndex: number, file: File | null) => {
    const key = `it_img${imageIndex}`;

    setImageFiles((prev) => {
      const newFiles = { ...prev, [key]: file };
      return newFiles;
    });

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview((prev) => ({ ...prev, [key]: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview((prev) => ({ ...prev, [key]: '' }));
    }
  }, []);

  const handleImageDelete = useCallback(
    (imageIndex: number, checked: boolean | 'indeterminate') => {
      const key = `it_img${imageIndex}`;
      if (checked === true) {
        setImagesToDelete((prev) => [...prev, key]);
      } else {
        setImagesToDelete((prev) => prev.filter((img) => img !== key));
      }
    },
    [],
  );

  // 옵션 그룹 추가
  const addOptionGroup = useCallback(() => {
    const newGroup: OptionGroup = {
      id: Date.now().toString(),
      option_name: '',
      items: [],
    };
    setOptionGroups((prev) => [...prev, newGroup]);
  }, []);

  // 옵션 그룹 제거
  const removeOptionGroup = useCallback((index: number) => {
    setOptionGroups((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // 옵션 그룹 이름 변경
  const updateOptionGroupName = useCallback((groupIndex: number, name: string) => {
    setOptionGroups((prev) =>
      prev.map((group, i) => (i === groupIndex ? { ...group, option_name: name } : group)),
    );
  }, []);

  // 옵션 아이템 추가
  const addOptionItem = useCallback((groupIndex: number) => {
    const newItem: OptionItem = {
      id: Date.now().toString(),
      value: '',
      stock_qty: 0,
      price_add: 0,
      use_yn: 'Y',
    };
    setOptionGroups((prev) =>
      prev.map((group, i) =>
        i === groupIndex ? { ...group, items: [...group.items, newItem] } : group,
      ),
    );
  }, []);

  // 옵션 아이템 제거
  const removeOptionItem = useCallback((groupIndex: number, itemIndex: number) => {
    setOptionGroups((prev) =>
      prev.map((group, i) =>
        i === groupIndex
          ? { ...group, items: group.items.filter((_, j) => j !== itemIndex) }
          : group,
      ),
    );
  }, []);

  // 옵션 아이템 업데이트
  const updateOptionItem = useCallback(
    (groupIndex: number, itemIndex: number, field: keyof OptionItem, value: string | number) => {
      setOptionGroups((prev) =>
        prev.map((group, i) =>
          i === groupIndex
            ? {
                ...group,
                items: group.items.map((item, j) =>
                  j === itemIndex ? { ...item, [field]: value } : item,
                ),
              }
            : group,
        ),
      );
    },
    [],
  );

  const getImageSrc = useCallback(
    (imageIndex: number) => {
      const key = `it_img${imageIndex}`;

      // 새로 업로드된 이미지 미리보기가 있으면 우선 표시
      if (imagePreview[key]) {
        return imagePreview[key];
      }

      // 기존 이미지가 있으면 표시 (ReviewTableRow와 동일한 방식)
      if (artwork && artwork[key as keyof ArtworkDetail]) {
        const imageName = artwork[key as keyof ArtworkDetail] as string;
        return imageName; // ReviewTableRow와 동일하게 직접 반환
      }

      return null;
    },
    [imagePreview, artwork],
  );

  // 승인/반려 토글 핸들러 (ReviewManagement와 동일한 API 사용)
  const handleApprovalToggle = async () => {
    if (!artwork) return;

    try {
      setApprovalLoading(true);
      const currentValue = String(artwork.it_use);
      const newVisibility = currentValue === '1' ? '0' : '1';

      const response = await fetch('/api/admin/review/toggle-visibility', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          itemId: artworkId,
          visibility: newVisibility,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '디자인 검수 상태 변경에 실패했습니다.');
      }

      const result = await response.json();

      if (result.success) {
        // 작품 정보 업데이트
        setArtwork((prev) => (prev ? { ...prev, it_use: Number(newVisibility) } : null));
      } else {
        throw new Error(result.message || '승인 상태 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error toggling approval:', error);
      setErrorMessage(
        error instanceof Error ? error.message : '승인 상태 변경 중 오류가 발생했습니다.',
      );
      setShowErrorDialog(true);
    } finally {
      setApprovalLoading(false);
    }
  };

  // 구매진행/제작검토 토글 핸들러 (ReviewManagement와 동일한 API 사용)
  const handleStatusToggle = async () => {
    if (!artwork) return;

    try {
      setStatusLoading(true);
      // 현재 상태에 따라 액션 결정
      const action = artwork.it_10 === 'N' ? 'review' : 'payment';

      const response = await fetch('/api/admin/review/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          itemId: artworkId,
          action: action,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '상태 변경에 실패했습니다.');
      }

      const result = await response.json();

      if (result.success) {
        // 작품 정보 업데이트
        const newStatus = result.data.newStatus;
        setArtwork((prev) => (prev ? { ...prev, it_10: newStatus } : null));
      } else {
        throw new Error(result.message || '상태 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      setErrorMessage(error instanceof Error ? error.message : '상태 변경 중 오류가 발생했습니다.');
      setShowErrorDialog(true);
    } finally {
      setStatusLoading(false);
    }
  };

  // 작품 상세페이지로 이동
  const handleViewArtwork = () => {
    router.push(`${ROUTES.PRODUCT}/${artworkId}`);
  };

  // 목표 좋아요 수 변경 핸들러
  const handleTargetLikesChange = (value: number) => {
    setTargetLikes(value);
    form.setValue('it_4', value);
  };

  // 사용자 정보 가져오기 핸들러
  const handleShowUserInfo = async () => {
    if (!artwork?.it_1) {
      setErrorMessage('사용자 정보를 찾을 수 없습니다.');
      setShowErrorDialog(true);
      return;
    }

    try {
      setUserInfoLoading(true);
      setShowUserInfoModal(true);

      const response = await fetch(`/api/admin/users/${artwork.it_1}`);

      if (!response.ok) {
        throw new Error('사용자 정보를 불러올 수 없습니다.');
      }

      const userData = await response.json();
      if (userData.success && userData.data) {
        setUserInfo(userData.data);
      } else {
        throw new Error(userData.message || '사용자 정보를 불러올 수 없습니다.');
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      setErrorMessage('사용자 정보를 불러오는 중 오류가 발생했습니다.');
      setShowErrorDialog(true);
      setShowUserInfoModal(false);
    } finally {
      setUserInfoLoading(false);
    }
  };

  const onSubmit = async (data: ArtworkFormData) => {
    // 대표 이미지 필수 검증
    const hasMainImage = artwork?.it_img1 && !imagesToDelete.includes('it_img1');
    const hasNewMainImage = imageFiles['it_img1'];

    if (!hasMainImage && !hasNewMainImage) {
      setShowRequiredImageDialog(true);
      return;
    }

    try {
      setSaving(true);

      // FormData를 사용하여 파일과 데이터를 함께 전송
      const submitData = new FormData();

      // 기본 폼 데이터 추가
      Object.entries(data).forEach(([key, value]) => {
        submitData.append(key, String(value));
      });

      // 이미지 파일들 추가
      Object.entries(imageFiles).forEach(([key, file]) => {
        if (file) {
          submitData.append(key, file);
        }
      });

      // 삭제할 이미지들 추가
      if (imagesToDelete.length > 0) {
        submitData.append('imagesToDelete', JSON.stringify(imagesToDelete));
      }

      submitData.append('optionGroups', JSON.stringify(optionGroups || []));

      const response = await fetch(`/api/admin/artwork/${artworkId}`, {
        method: 'PUT',
        body: submitData,
      });

      if (!response.ok) {
        throw new Error('디자인 정보 수정에 실패했습니다.');
      }

      setShowSuccessDialog(true);
    } catch (error) {
      console.error('Error updating artwork:', error);
      setErrorMessage('디자인 정보 수정 중 오류가 발생했습니다.');
      setShowErrorDialog(true);
    } finally {
      setSaving(false);
    }
  };

  const firstCategoryOptions = useMemo(() => {
    return categories
      .filter((category) => category.id?.length === 2) // 1차 카테고리만
      .map((category) => (
        <SelectItem key={category.id} value={category.id}>
          {category.name}
        </SelectItem>
      ));
  }, [categories]);

  const secondCategoryOptions = useMemo(() => {
    // 1차 카테고리가 선택되어 있거나, 기존에 2차 카테고리가 있는 경우
    const parentId = ca_id || (ca_id2 ? ca_id2.substring(0, 2) : '');
    if (!parentId) return [];

    return categories
      .filter(
        (category) =>
          category.id?.length === 4 && // 2차 카테고리만
          category.id?.startsWith(parentId), // 선택된 1차 카테고리의 하위
      )
      .map((category) => (
        <SelectItem key={category.id} value={category.id}>
          {category.name}
        </SelectItem>
      ));
  }, [categories, ca_id, ca_id2]);

  const thirdCategoryOptions = useMemo(() => {
    // 2차 카테고리가 선택되어 있거나, 기존에 3차 카테고리가 있는 경우
    const parentId = ca_id2 || (ca_id3 ? ca_id3.substring(0, 4) : '');
    if (!parentId) return [];

    return categories
      .filter(
        (category) =>
          category.id?.length === 6 && // 3차 카테고리만
          category.id?.startsWith(parentId), // 선택된 2차 카테고리의 하위
      )
      .map((category) => (
        <SelectItem key={category.id} value={category.id}>
          {category.name}
        </SelectItem>
      ));
  }, [categories, ca_id2, ca_id3]);

  const fourthCategoryOptions = useMemo(() => {
    // 3차 카테고리가 선택되어 있거나, 기존에 4차 카테고리가 있는 경우
    const parentId = ca_id3 || (ca_id4 ? ca_id4.substring(0, 6) : '');
    if (!parentId) return [];

    return categories
      .filter(
        (category) =>
          category.id?.length === 8 && // 4차 카테고리만
          category.id?.startsWith(parentId), // 선택된 3차 카테고리의 하위
      )
      .map((category) => (
        <SelectItem key={category.id} value={category.id}>
          {category.name}
        </SelectItem>
      ));
  }, [categories, ca_id3, ca_id4]);

  return loading ? (
    <div className='flex min-h-screen items-center justify-center'>
      <LoadingSpinner size='lg' message='디자인 정보를 불러오는 중...' />
    </div>
  ) : !artwork ? (
    <div className='flex min-h-screen items-center justify-center bg-gray-50'>
      <div className='text-lg text-red-600'>디자인을 찾을 수 없습니다.</div>
    </div>
  ) : (
    <div className='min-h-screen'>
      <div>
        <div className='mb-6 flex items-center justify-between'>
          <div className='flex items-center space-x-4'>
            <Link href={ROUTES.ADMIN_REVIEW}>
              <Button variant='outline' size='sm'>
                <ArrowLeft className='h-4 w-4' />
              </Button>
            </Link>
            <h1 className='text-2xl font-bold text-gray-900'>디자인 설정</h1>
          </div>
        </div>

        {/* 작품 정보 상단 섹션 */}
        <Card className='mb-6'>
          <CardContent>
            <div className='flex items-center justify-between'>
              {/* 승인/반려 토글 */}
              <div className='flex flex-col items-center space-y-2'>
                <div className='flex items-center space-x-2'>
                  <Switch
                    checked={Number(artwork?.it_use) === 1}
                    onCheckedChange={handleApprovalToggle}
                    disabled={approvalLoading}
                    className='cursor-pointer'
                  />
                  <span className='text-sm text-gray-700'>
                    {Number(artwork?.it_use) === 1 ? '승인' : '반려'}
                  </span>
                </div>
                {approvalLoading && <span className='text-xs text-blue-600'>처리중...</span>}
              </div>

              {/* 작품 아이디 (클릭 가능) */}
              <div className='flex flex-col items-center'>
                <Button
                  onClick={handleViewArtwork}
                  variant='ghost'
                  className='h-auto p-2 text-blue-600 hover:bg-blue-50 hover:text-blue-700'
                >
                  <div className='flex flex-col items-center space-y-1'>
                    <div className='rounded-full bg-gray-100 px-3 py-1'>
                      <span className='text-sm font-medium'>{artworkId}</span>
                    </div>
                    <span className='text-xs text-gray-500'>상세보기</span>
                  </div>
                </Button>
              </div>

              {/* 작품 메인 이미지 */}
              <div className='relative h-20 w-20 flex-shrink-0'>
                {artwork?.it_img1 ? (
                  <Image
                    src={artwork.it_img1}
                    alt={artwork.it_name || '작품 이미지'}
                    fill
                    className='rounded-lg object-cover'
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML =
                          '<div class="flex h-full w-full items-center justify-center rounded-lg bg-gray-200"><span class="text-xs text-gray-400">이미지<br/>없음</span></div>';
                      }
                    }}
                  />
                ) : (
                  <div className='flex h-full w-full items-center justify-center rounded-lg bg-gray-200'>
                    <span className='text-xs text-gray-400'>
                      이미지
                      <br />
                      없음
                    </span>
                  </div>
                )}
              </div>

              {/* 작품명과 판매자 정보 */}
              <div className='flex flex-col space-y-1'>
                <h2 className='text-lg font-bold text-gray-900'>{artwork?.it_name || '-'}</h2>
                <p className='text-sm text-gray-600'>판매자: {artwork?.it_1 || '-'}</p>
              </div>

              {/* 구매진행/제작검토 토글 */}
              <div className='flex flex-col items-center space-y-2'>
                <div className='flex items-center space-x-2'>
                  <Switch
                    checked={artwork?.it_10 === 'N'}
                    onCheckedChange={handleStatusToggle}
                    disabled={statusLoading}
                    className='cursor-pointer'
                  />
                  <span className='text-sm text-gray-700'>
                    {statusLoading
                      ? '처리중...'
                      : artwork?.it_10 === 'N'
                        ? '구매 진행'
                        : '제작 검토'}
                  </span>
                </div>
              </div>

              {/* 좋아요 수와 목표 좋아요 수 */}
              <div className='flex items-center space-x-4'>
                <div className='flex items-center space-x-2'>
                  <Heart className='h-4 w-4 text-red-500' fill='currentColor' />
                  <span className='text-sm font-medium'>{currentLikes}</span>
                  <span className='text-sm text-gray-400'>/</span>
                  <div className='flex items-center space-x-1'>
                    <Input
                      type='number'
                      value={targetLikes}
                      onChange={(e) => handleTargetLikesChange(parseInt(e.target.value) || 0)}
                      className='h-8 w-20 text-center text-sm'
                      min='0'
                    />
                    <span className='text-xs text-gray-500'>목표</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
          <TabsList className='grid w-full grid-cols-4'>
            <TabsTrigger value='home'>Home</TabsTrigger>
            <TabsTrigger value='product-detail'>Product detail</TabsTrigger>
            <TabsTrigger value='detail'>Design detail</TabsTrigger>
            <TabsTrigger value='option1'>Option detail</TabsTrigger>
          </TabsList>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='mt-6 space-y-6'>
              {/* Home Tab */}
              <TabsContent value='home' className='space-y-6'>
                <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
                  {/* 좌측: 이미지 섹션 */}
                  <div className='space-y-4'>
                    <Card>
                      <CardHeader>
                        <CardTitle>디자인 이미지</CardTitle>
                        <p className='text-sm text-gray-600'>
                          대표 이미지 1개(필수)와 추가 이미지 최대 3개까지 업로드할 수 있습니다.
                        </p>
                      </CardHeader>
                      <CardContent className='space-y-4'>
                        {/* 메인 이미지 미리보기 */}
                        <div className='flex justify-center'>
                          <div className='relative h-[365px] w-[365px]'>
                            {artwork?.it_img1 ? (
                              <Image
                                src={artwork.it_img1}
                                alt={artwork.it_name || '작품 이미지'}
                                fill
                                className='rounded-lg object-cover'
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.innerHTML =
                                      '<div class="flex h-full w-full items-center justify-center rounded-lg bg-gray-200"><span class="text-gray-400">이미지 없음</span></div>';
                                  }
                                }}
                              />
                            ) : (
                              <div className='flex h-full w-full items-center justify-center rounded-lg bg-gray-200'>
                                <span className='text-gray-400'>이미지 없음</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 서브 이미지들 */}
                        <div className='grid grid-cols-3 gap-2'>
                          {[2, 3, 4].map((index) => {
                            const imgKey = `it_img${index}` as keyof ArtworkDetail;
                            const imageSrc = artwork?.[imgKey] as string;
                            return (
                              <div key={index} className='relative aspect-square'>
                                {imageSrc ? (
                                  <Image
                                    src={imageSrc}
                                    alt={`서브 이미지 ${index}`}
                                    fill
                                    className='rounded object-cover'
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      const parent = target.parentElement;
                                      if (parent) {
                                        parent.innerHTML =
                                          '<div class="flex h-full w-full items-center justify-center rounded bg-gray-200"><span class="text-xs text-gray-400">없음</span></div>';
                                      }
                                    }}
                                  />
                                ) : (
                                  <div className='flex h-full w-full items-center justify-center rounded bg-gray-200'>
                                    <span className='text-xs text-gray-400'>없음</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* 우측: 기본 정보 섹션 */}
                  <div className='space-y-4'>
                    {/* 카테고리 선택 */}
                    <Card>
                      <CardHeader>
                        <CardTitle>카테고리</CardTitle>
                        <p className='text-sm text-gray-600'>
                          1차 분류는 반드시 선택하셔야 합니다. 최대 4차까지 선택 가능합니다.
                        </p>
                      </CardHeader>
                      <CardContent className='space-y-4'>
                        <div className='grid grid-cols-2 gap-4'>
                          <FormField
                            control={form.control}
                            name='ca_id'
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  1차 분류<span className='text-red-500'>*</span>
                                </FormLabel>
                                <Select
                                  value={field.value}
                                  onValueChange={(value) => handleCategoryChange('ca_id', value)}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder='1차 선택' />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>{firstCategoryOptions}</SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name='ca_id2'
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>2차 분류</FormLabel>
                                <Select
                                  value={field.value || 'none'}
                                  onValueChange={(value) =>
                                    handleCategoryChange('ca_id2', value === 'none' ? '' : value)
                                  }
                                  disabled={!ca_id && !ca_id2}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder='2차 선택' />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value='none'>선택안함</SelectItem>
                                    {secondCategoryOptions}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name='ca_id3'
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>3차 분류</FormLabel>
                                <Select
                                  value={field.value || 'none'}
                                  onValueChange={(value) =>
                                    handleCategoryChange('ca_id3', value === 'none' ? '' : value)
                                  }
                                  disabled={!ca_id2 && !ca_id3}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder='3차 선택' />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value='none'>선택안함</SelectItem>
                                    {thirdCategoryOptions}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name='ca_id4'
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>4차 분류</FormLabel>
                                <Select
                                  value={field.value || 'none'}
                                  onValueChange={(value) =>
                                    handleCategoryChange('ca_id4', value === 'none' ? '' : value)
                                  }
                                  disabled={!ca_id3 && !ca_id4}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder='4차 선택' />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value='none'>선택안함</SelectItem>
                                    {fourthCategoryOptions}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* 기본 정보 */}
                    <Card>
                      <CardHeader>
                        <CardTitle>기본 정보</CardTitle>
                      </CardHeader>
                      <CardContent className='space-y-4'>
                        <FormField
                          control={form.control}
                          name='it_name'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                디자인명<span className='text-red-500'>*</span>
                              </FormLabel>
                              <FormControl>
                                <Input placeholder='디자인명을 입력하세요' {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className='space-y-2'>
                          <Label>디자이너</Label>
                          <div className='flex items-center gap-x-4'>
                            <div>
                              <p className='text-sm font-medium text-gray-900'>
                                {form.getValues('it_1') || '-'}
                              </p>
                              <p className='text-xs text-gray-500'>
                                이 디자인을 등록한 디자이너입니다.
                              </p>
                            </div>
                            <Button
                              type='button'
                              variant='outline'
                              size='sm'
                              onClick={handleShowUserInfo}
                              className='ml-3'
                            >
                              정보 보기
                            </Button>
                          </div>
                        </div>
                        <FormField
                          control={form.control}
                          name='it_3'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>디자인 설명</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder='디자인에 대한 상세 설명을 입력하세요'
                                  rows={4}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* 작품 이미지 갤러리 */}
                <Card>
                  <CardHeader>
                    <CardTitle>디자인 이미지</CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-6'>
                    {[1, 2, 3, 4].map((imageIndex) => {
                      const imgKey = `it_img${imageIndex}` as keyof ArtworkDetail;
                      const imageSrc = artwork?.[imgKey] as string;

                      if (!imageSrc) return null;

                      return (
                        <div key={imageIndex} className='space-y-2'>
                          <h4 className='text-sm font-medium text-gray-700'>
                            {imageIndex === 1 ? '대표 이미지' : `추가 이미지 ${imageIndex - 1}`}
                          </h4>
                          <div className='relative w-full'>
                            <div className='relative mx-auto w-full max-w-2xl'>
                              <Image
                                src={imageSrc}
                                alt={`${artwork?.it_name || '작품'} - ${imageIndex === 1 ? '대표 이미지' : `이미지 ${imageIndex}`}`}
                                width={800}
                                height={600}
                                className='w-full rounded-lg border object-contain'
                                style={{ aspectRatio: '4/3' }}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.innerHTML =
                                      '<div class="flex h-60 w-full items-center justify-center rounded-lg bg-gray-100 border"><span class="text-gray-400">이미지를 불러올 수 없습니다</span></div>';
                                  }
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {!artwork?.it_img1 && (
                      <div className='py-12 text-center'>
                        <div className='mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100'>
                          <svg
                            className='h-8 w-8 text-gray-400'
                            fill='none'
                            viewBox='0 0 24 24'
                            stroke='currentColor'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
                            />
                          </svg>
                        </div>
                        <p className='text-gray-500'>등록된 이미지가 없습니다.</p>
                        <p className='mt-1 text-sm text-gray-400'>
                          Design detail 탭에서 이미지를 업로드해주세요.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Product detail Tab */}
              <TabsContent value='product-detail' className='space-y-6'>
                {/* 상세 정보 */}
                <Card>
                  <CardHeader>
                    <CardTitle>상세 정보</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='grid grid-cols-4 gap-4'>
                      <FormField
                        control={form.control}
                        name='it_order'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>출력순서</FormLabel>
                            <FormControl>
                              <Input
                                type='number'
                                placeholder='숫자가 작을수록 상위에 출력'
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <p className='text-xs text-gray-500'>
                              디자인 목록에서의 정렬 순서를 설정합니다. 숫자가 작을수록 상위에
                              표시됩니다.
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name='it_sell_email'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>판매자 이메일</FormLabel>
                            <FormControl>
                              <Input type='email' placeholder='판매자 이메일' {...field} />
                            </FormControl>
                            <p className='text-xs text-gray-500'>
                              판매자의 이메일 주소를 입력하세요.
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name='it_use'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className='text-sm font-medium text-gray-700'>
                              판매가능
                            </FormLabel>
                            <div className='flex items-center space-x-2 pt-2'>
                              <Checkbox
                                checked={field.value === 1}
                                onCheckedChange={(checked) => field.onChange(checked ? 1 : 0)}
                              />
                              <span className='text-sm text-gray-600'>
                                {field.value === 1 ? '판매 가능' : '판매 불가'}
                              </span>
                            </div>
                            <p className='text-xs text-gray-500'>
                              체크 해제 시 고객이 구매할 수 없습니다.
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name='it_nocoupon'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className='text-sm font-medium text-gray-700'>
                              쿠폰적용
                            </FormLabel>
                            <div className='flex items-center space-x-2 pt-2'>
                              <Checkbox
                                checked={field.value === 1}
                                onCheckedChange={(checked) => field.onChange(checked ? 1 : 0)}
                              />
                              <span className='text-sm text-gray-600'>
                                {field.value === 1 ? '쿠폰 적용 안함' : '쿠폰 적용'}
                              </span>
                            </div>
                            <p className='text-xs text-gray-500'>
                              체크 시 할인쿠폰을 사용할 수 없습니다.
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>가격 및 재고</CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div className='grid grid-cols-3 gap-4'>
                      <FormField
                        control={form.control}
                        name='it_price'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>판매가격</FormLabel>
                            <div className='flex items-center space-x-2'>
                              <FormControl>
                                <Input
                                  type='number'
                                  min='0'
                                  placeholder='0'
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <span className='text-sm text-gray-500'>원</span>
                            </div>
                            <p className='text-xs text-gray-500'>
                              고객에게 판매할 가격을 원 단위로 입력하세요.
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name='it_point_type'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>포인트 유형</FormLabel>
                            <Select
                              value={field.value.toString()}
                              onValueChange={(value) => field.onChange(parseInt(value))}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value='0'>설정금액</SelectItem>
                                <SelectItem value='1'>판매가기준 설정비율</SelectItem>
                                <SelectItem value='2'>구매가기준 설정비율</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className='text-xs text-gray-500'>
                              고객이 디자인 구매 시 받을 포인트의 계산 방식을 선택하세요.
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name='it_point'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>포인트</FormLabel>
                            <div className='flex items-center space-x-2'>
                              <FormControl>
                                <Input
                                  type='number'
                                  min='0'
                                  placeholder='0'
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <span className='text-sm text-gray-500'>
                                {it_point_type > 0 ? '%' : '점'}
                              </span>
                            </div>
                            <p className='text-xs text-gray-500'>
                              {it_point_type === 0
                                ? '고정 포인트 금액을 입력하세요.'
                                : '포인트 적립 비율을 퍼센트로 입력하세요.'}
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className='grid grid-cols-4 gap-4'>
                      <FormField
                        control={form.control}
                        name='it_stock_qty'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>재고수량</FormLabel>
                            <div className='flex items-center space-x-2'>
                              <FormControl>
                                <Input
                                  type='number'
                                  min='0'
                                  placeholder='0'
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <span className='text-sm text-gray-500'>개</span>
                            </div>
                            <p className='text-xs text-gray-500'>
                              판매 가능한 디자인의 재고 수량을 입력하세요. 0으로 설정 시 품절로
                              표시됩니다.
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name='it_noti_qty'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>재고 통보수량</FormLabel>
                            <div className='flex items-center space-x-2'>
                              <FormControl>
                                <Input
                                  type='number'
                                  min='0'
                                  placeholder='0'
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <span className='text-sm text-gray-500'>개</span>
                            </div>
                            <p className='text-xs text-gray-500'>
                              재고가 이 수량 이하로 떨어지면 재고 부족 알림을 표시합니다.
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name='it_soldout'
                        render={({ field }) => (
                          <FormItem>
                            <div className='flex items-center space-x-2'>
                              <Checkbox
                                checked={field.value === 1}
                                onCheckedChange={(checked) => field.onChange(checked ? 1 : 0)}
                              />
                              <FormLabel>품절</FormLabel>
                            </div>
                            <p className='text-xs text-gray-500'>
                              체크 시 품절 상태로 표시되어 구매할 수 없습니다.
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name='it_stock_sms'
                        render={({ field }) => (
                          <FormItem>
                            <div className='flex items-center space-x-2'>
                              <Checkbox
                                checked={field.value === 1}
                                onCheckedChange={(checked) => field.onChange(checked ? 1 : 0)}
                              />
                              <FormLabel>재입고 SMS</FormLabel>
                            </div>
                            <p className='text-xs text-gray-500'>
                              체크 시 재입고 알림 기능을 활성화합니다.
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className='grid grid-cols-3 gap-4'>
                      <FormField
                        control={form.control}
                        name='it_buy_min_qty'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>최소구매수량</FormLabel>
                            <div className='flex items-center space-x-2'>
                              <FormControl>
                                <Input
                                  type='number'
                                  min='0'
                                  placeholder='0'
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <span className='text-sm text-gray-500'>개</span>
                            </div>
                            <p className='text-xs text-gray-500'>
                              디자인 구매 시 최소 구매 수량을 설정합니다. (0은 제한 없음)
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name='it_buy_max_qty'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>최대구매수량</FormLabel>
                            <div className='flex items-center space-x-2'>
                              <FormControl>
                                <Input
                                  type='number'
                                  min='0'
                                  placeholder='0'
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <span className='text-sm text-gray-500'>개</span>
                            </div>
                            <p className='text-xs text-gray-500'>
                              디자인 구매 시 최대 구매 수량을 설정합니다. (0은 제한 없음)
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name='it_notax'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>과세 유형</FormLabel>
                            <Select
                              value={field.value.toString()}
                              onValueChange={(value) => field.onChange(parseInt(value))}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value='0'>과세</SelectItem>
                                <SelectItem value='1'>비과세</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className='text-xs text-gray-500'>
                              디자인의 과세유형(과세, 비과세)을 설정합니다.
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>배송비</CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div className='grid grid-cols-2 gap-4'>
                      <FormField
                        control={form.control}
                        name='it_sc_type'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>배송비 유형</FormLabel>
                            <Select
                              value={field.value.toString()}
                              onValueChange={(value) => field.onChange(parseInt(value))}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value='0'>쇼핑몰 기본설정 사용</SelectItem>
                                <SelectItem value='1'>무료배송</SelectItem>
                                <SelectItem value='2'>조건부 무료배송</SelectItem>
                                <SelectItem value='3'>유료배송</SelectItem>
                                <SelectItem value='4'>수량별 부과</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className='text-xs text-gray-500'>
                              이 디자인의 배송비 계산 방식을 선택하세요.
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name='it_sc_method'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>배송비 결제</FormLabel>
                            <Select
                              value={field.value.toString()}
                              onValueChange={(value) => field.onChange(parseInt(value))}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value='0'>선불</SelectItem>
                                <SelectItem value='1'>착불</SelectItem>
                                <SelectItem value='2'>사용자선택</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className='text-xs text-gray-500'>배송비 결제 방식을 선택하세요.</p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {it_sc_type > 1 && (
                      <div className='grid grid-cols-2 gap-4'>
                        <FormField
                          control={form.control}
                          name='it_sc_price'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>기본배송비</FormLabel>
                              <div className='flex items-center space-x-2'>
                                <FormControl>
                                  <Input
                                    type='number'
                                    min='0'
                                    placeholder='0'
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <span className='text-sm text-gray-500'>원</span>
                              </div>
                              <p className='text-xs text-gray-500'>
                                기본 배송비 금액을 원 단위로 입력하세요.
                              </p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {it_sc_type === 2 && (
                          <FormField
                            control={form.control}
                            name='it_sc_minimum'
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>무료배송 최소금액</FormLabel>
                                <div className='flex items-center space-x-2'>
                                  <FormControl>
                                    <Input
                                      type='number'
                                      min='0'
                                      placeholder='0'
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(parseInt(e.target.value) || 0)
                                      }
                                    />
                                  </FormControl>
                                  <span className='text-sm text-gray-500'>원 이상</span>
                                </div>
                                <p className='text-xs text-gray-500'>
                                  이 금액 이상 주문 시 배송비가 무료가 됩니다.
                                </p>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                        {it_sc_type === 4 && (
                          <FormField
                            control={form.control}
                            name='it_sc_qty'
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>수량별 배송비</FormLabel>
                                <div className='flex items-center space-x-2'>
                                  <FormControl>
                                    <Input
                                      type='number'
                                      min='0'
                                      placeholder='0'
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(parseInt(e.target.value) || 0)
                                      }
                                    />
                                  </FormControl>
                                  <span className='text-sm text-gray-500'>개마다</span>
                                </div>
                                <p className='text-xs text-gray-500'>
                                  설정한 수량마다 기본배송비가 추가로 부과됩니다.
                                </p>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Design detail Tab */}
              <TabsContent value='detail' className='space-y-6'>
                {/* 작품 이미지 관리 */}
                <Card>
                  <CardHeader>
                    <CardTitle>작품 이미지 관리</CardTitle>
                    <p className='text-sm text-gray-600'>
                      이미지를 업로드하거나 삭제할 수 있습니다. 권장 크기: 800x800px 이상
                    </p>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    {ARTWORK_IMAGE_INDICES.map((imageIndex) => (
                      <ArtworkImageUploadItem
                        key={imageIndex}
                        imageIndex={imageIndex}
                        artwork={artwork}
                        imageFiles={imageFiles}
                        imagesToDelete={imagesToDelete}
                        onImageUpload={handleImageUpload}
                        onImageDelete={handleImageDelete}
                        getImageSrc={getImageSrc}
                      />
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Option Tabs */}
              <TabsContent value='option1' className='space-y-6'>
                <Card>
                  <CardHeader>
                    <CardTitle>옵션 설정</CardTitle>
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='text-sm text-gray-600'>
                          디자인에 옵션을 추가하여 다양한 선택사항을 제공할 수 있습니다.
                        </p>
                        <p className='text-xs text-gray-500'>
                          옵션명별로 여러 옵션값을 설정할 수 있습니다. (예: 사이즈 → S, M, L)
                        </p>
                      </div>
                      <Button type='button' onClick={addOptionGroup} size='sm'>
                        <Plus className='mr-2 h-4 w-4' />
                        옵션 그룹 추가
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {optionGroups.length === 0 ? (
                      <div className='py-8 text-center text-gray-500'>
                        옵션이 없습니다. 위의 &ldquo;옵션 그룹 추가&rdquo; 버튼을 클릭하여 옵션을
                        추가해보세요.
                      </div>
                    ) : (
                      <div className='space-y-6'>
                        {optionGroups.map((group, groupIndex) => (
                          <OptionGroupComponent
                            key={group.id}
                            group={group}
                            groupIndex={groupIndex}
                            onRemoveGroup={removeOptionGroup}
                            onUpdateGroupName={updateOptionGroupName}
                            onAddOptionItem={addOptionItem}
                            onRemoveOptionItem={removeOptionItem}
                            onUpdateOptionItem={updateOptionItem}
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value='option2' className='space-y-6'>
                <div className='py-8 text-center text-gray-500'>
                  2번째 옵션 리스트는 준비 중입니다.
                </div>
              </TabsContent>

              <TabsContent value='option3' className='space-y-6'>
                <div className='py-8 text-center text-gray-500'>
                  3번째 옵션 리스트는 준비 중입니다.
                </div>
              </TabsContent>

              <div className='flex justify-end space-x-3'>
                <Link href={ROUTES.ADMIN_REVIEW}>
                  <Button type='button' variant='outline'>
                    취소
                  </Button>
                </Link>
                <Button type='submit' disabled={saving}>
                  {saving ? '저장 중' : '저장'}
                </Button>
              </div>
            </form>
          </Form>
        </Tabs>
      </div>

      {/* Dialogs */}
      {/* 대표 이미지 필수 Dialog */}
      <MessageDialog
        open={showRequiredImageDialog}
        onOpenChange={setShowRequiredImageDialog}
        title='대표 이미지 필수'
        description='대표 이미지는 필수입니다. 대표 이미지를 등록해주세요.'
        confirmText='확인'
      />

      {/* 디자인 수정 성공 Dialog */}
      <MessageDialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        title='수정 완료'
        description='디자인 정보가 성공적으로 수정되었습니다.'
        confirmText='확인'
        onConfirm={() => router.push(ROUTES.ADMIN_REVIEW)}
      />

      {/* 디자인 수정 실패 Dialog */}
      <MessageDialog
        open={showErrorDialog}
        onOpenChange={setShowErrorDialog}
        title='수정 실패'
        description={errorMessage}
        confirmText='확인'
      />

      {/* 데이터 로딩 실패 Dialog */}
      <MessageDialog
        open={showLoadErrorDialog}
        onOpenChange={setShowLoadErrorDialog}
        title='로딩 실패'
        description={errorMessage}
        confirmText='확인'
      />

      {/* 사용자 정보 모달 */}
      <Dialog open={showUserInfoModal} onOpenChange={setShowUserInfoModal}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>디자이너 정보</DialogTitle>
            <DialogDescription>이 디자인을 등록한 디자이너의 상세 정보입니다.</DialogDescription>
          </DialogHeader>

          {userInfoLoading ? (
            <div className='flex items-center justify-center py-8'>
              <LoadingSpinner size='md' message='사용자 정보를 불러오는 중...' />
            </div>
          ) : userInfo ? (
            <div className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <Label className='text-sm font-medium text-gray-700'>회원ID</Label>
                  <p className='text-sm text-gray-900'>{userInfo.mb_id || '-'}</p>
                </div>
                <div>
                  <Label className='text-sm font-medium text-gray-700'>이름</Label>
                  <p className='text-sm text-gray-900'>{userInfo.mb_name || '-'}</p>
                </div>
              </div>

              <div>
                <Label className='text-sm font-medium text-gray-700'>이메일</Label>
                <p className='text-sm text-gray-900'>{userInfo.mb_email || '-'}</p>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <Label className='text-sm font-medium text-gray-700'>연락처</Label>
                  <p className='text-sm text-gray-900'>{userInfo.mb_hp || '-'}</p>
                </div>
                <div>
                  <Label className='text-sm font-medium text-gray-700'>회원등급</Label>
                  <p className='text-sm text-gray-900'>{userInfo.mb_level || '-'}</p>
                </div>
              </div>

              <div>
                <Label className='text-sm font-medium text-gray-700'>가입일</Label>
                <p className='text-sm text-gray-900'>
                  {userInfo.mb_datetime
                    ? new Date(userInfo.mb_datetime).toLocaleDateString('ko-KR')
                    : '-'}
                </p>
              </div>

              <div>
                <Label className='text-sm font-medium text-gray-700'>최근 로그인</Label>
                <p className='text-sm text-gray-900'>
                  {userInfo.mb_today_login
                    ? new Date(userInfo.mb_today_login).toLocaleString('ko-KR')
                    : '-'}
                </p>
              </div>

              {userInfo.mb_memo && (
                <div>
                  <Label className='text-sm font-medium text-gray-700'>메모</Label>
                  <p className='text-sm text-gray-900'>{userInfo.mb_memo}</p>
                </div>
              )}
            </div>
          ) : (
            <div className='py-8 text-center text-gray-500'>사용자 정보를 불러올 수 없습니다.</div>
          )}

          <div className='flex justify-end'>
            <Button variant='outline' onClick={() => setShowUserInfoModal(false)}>
              닫기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
