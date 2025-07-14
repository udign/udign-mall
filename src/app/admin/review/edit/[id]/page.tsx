'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/primitives/button';
import { Input } from '@/components/ui/primitives/input';
import { Label } from '@/components/ui/primitives/label';
import { Textarea } from '@/components/ui/primitives/textarea';
import { Checkbox } from '@/components/ui/primitives/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/primitives/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/primitives/card';
import { ArtworkDetail, Category, UpdateArtworkRequest } from '@/types/artwork';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import LoadingSpinner from '@/components/states/LoadingSpinner';
import { ROUTES } from '@/lib/routes';

export default function ArtworkEditPage() {
  const [artwork, setArtwork] = useState<ArtworkDetail | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [imageFiles, setImageFiles] = useState<{ [key: string]: File | null }>({});
  const [imagePreview, setImagePreview] = useState<{ [key: string]: string }>({});
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [formData, setFormData] = useState<UpdateArtworkRequest>({
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
    it_sc_type: 0,
    it_sc_method: 0,
    it_sc_price: 0,
    it_sc_minimum: 0,
    it_sc_qty: 0,
  });

  const params = useParams();
  const router = useRouter();
  const artworkId = params.id as string;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 작품 정보와 카테고리 정보를 병렬로 가져오기
        const [artworkRes, categoriesRes] = await Promise.all([
          fetch(`/api/admin/artwork/${artworkId}`),
          fetch('/api/admin/categories'),
        ]);

        if (!artworkRes.ok) {
          throw new Error('작품 정보를 불러올 수 없습니다.');
        }

        const artworkData = await artworkRes.json();
        const categoriesData = categoriesRes.ok ? await categoriesRes.json() : [];

        setArtwork(artworkData);
        setCategories(categoriesData);

        // 카테고리 정보 자동 보완
        const ca_id = artworkData.ca_id || '';
        const ca_id2 = artworkData.ca_id2 || '';
        const ca_id3 = artworkData.ca_id3 || '';

        // 하위 카테고리가 있지만 상위 카테고리가 없는 경우 자동 보완
        let finalCaId = ca_id;
        let finalCaId2 = ca_id2;
        const finalCaId3 = ca_id3;

        // 3차 카테고리가 있지만 2차가 없는 경우
        if (ca_id3 && !ca_id2 && ca_id3.length >= 4) {
          finalCaId2 = ca_id3.substring(0, 4);
        }

        // 2차 카테고리가 있지만 1차가 없는 경우
        if ((finalCaId2 || ca_id2) && !ca_id && (finalCaId2 || ca_id2).length >= 2) {
          finalCaId = (finalCaId2 || ca_id2).substring(0, 2);
        }

        // 폼 데이터 초기화
        setFormData({
          it_name: artworkData.it_name || '',
          it_1: artworkData.it_1 || '',
          it_3: artworkData.it_3 || '',
          it_4: artworkData.it_4 || 0,
          it_price: artworkData.it_price || 0,
          it_order: artworkData.it_order || 0,
          it_use: artworkData.it_use || 1,
          it_soldout: artworkData.it_soldout || 0,
          it_point: artworkData.it_point || 0,
          it_point_type: artworkData.it_point_type || 0,
          it_supply_point: artworkData.it_supply_point || 0,
          it_stock_qty: artworkData.it_stock_qty || 0,
          it_stock_sms: artworkData.it_stock_sms || 0,
          it_noti_qty: artworkData.it_noti_qty || 0,
          it_buy_min_qty: artworkData.it_buy_min_qty || 0,
          it_buy_max_qty: artworkData.it_buy_max_qty || 0,
          it_notax: artworkData.it_notax || 0,
          it_sell_email: artworkData.it_sell_email || '',
          it_nocoupon: artworkData.it_nocoupon || 0,
          ca_id: finalCaId,
          ca_id2: finalCaId2,
          ca_id3: finalCaId3,
          it_sc_type: artworkData.it_sc_type || 0,
          it_sc_method: artworkData.it_sc_method || 0,
          it_sc_price: artworkData.it_sc_price || 0,
          it_sc_minimum: artworkData.it_sc_minimum || 0,
          it_sc_qty: artworkData.it_sc_qty || 0,
        });
      } catch (error) {
        console.error('Error fetching data:', error);
        alert('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (artworkId) {
      fetchData();
    }
  }, [artworkId]);

  const handleInputChange = (field: keyof UpdateArtworkRequest, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // 카테고리 변경 핸들러 (하위 카테고리 초기화 포함)
  const handleCategoryChange = (field: keyof UpdateArtworkRequest, value: string) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      // 1차 카테고리 변경 시 2차, 3차 초기화
      if (field === 'ca_id') {
        newData.ca_id2 = '';
        newData.ca_id3 = '';
      }
      // 2차 카테고리 변경 시 3차 초기화
      else if (field === 'ca_id2') {
        newData.ca_id3 = '';
      }

      return newData;
    });
  };

  const handleCheckboxChange = (
    field: keyof UpdateArtworkRequest,
    checked: boolean | 'indeterminate',
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: checked === true ? 1 : 0,
    }));
  };

  // 이미지 핸들러 함수들
  const handleImageUpload = (imageIndex: number, file: File | null) => {
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
  };

  const handleImageDelete = (imageIndex: number, checked: boolean | 'indeterminate') => {
    const key = `it_img${imageIndex}`;
    if (checked === true) {
      setImagesToDelete((prev) => [...prev, key]);
    } else {
      setImagesToDelete((prev) => prev.filter((img) => img !== key));
    }
  };

  const getImageSrc = (imageIndex: number) => {
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.it_name.trim()) {
      alert('작품명을 입력해주세요.');
      return;
    }

    if (!formData.ca_id) {
      alert('기본분류를 선택해주세요.');
      return;
    }

    // 대표 이미지 필수 검증
    const hasMainImage = artwork?.it_img1 && !imagesToDelete.includes('it_img1');
    const hasNewMainImage = imageFiles['it_img1'];

    if (!hasMainImage && !hasNewMainImage) {
      alert('대표 이미지는 필수입니다. 대표 이미지를 등록해주세요.');
      return;
    }

    try {
      setSaving(true);

      // FormData를 사용하여 파일과 데이터를 함께 전송
      const submitData = new FormData();

      // 기본 폼 데이터 추가
      Object.entries(formData).forEach(([key, value]) => {
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

      const response = await fetch(`/api/admin/artwork/${artworkId}`, {
        method: 'PUT',
        body: submitData, // Content-Type 헤더 제거 - FormData가 자동 설정
      });

      if (!response.ok) {
        throw new Error('작품 정보 수정에 실패했습니다.');
      }

      alert('작품 정보가 성공적으로 수정되었습니다.');
      router.push(ROUTES.ADMIN_REVIEW);
    } catch (error) {
      console.error('Error updating artwork:', error);
      alert('작품 정보 수정 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 1차 카테고리 옵션 렌더링
  const renderFirstCategoryOptions = () => {
    return categories
      .filter((category) => category.ca_id.length === 2) // 1차 카테고리만
      .map((category) => (
        <SelectItem key={category.ca_id} value={category.ca_id}>
          {category.ca_name}
        </SelectItem>
      ));
  };

  // 2차 카테고리 옵션 렌더링
  const renderSecondCategoryOptions = () => {
    // 1차 카테고리가 선택되어 있거나, 기존에 2차 카테고리가 있는 경우
    const parentId = formData.ca_id || (formData.ca_id2 ? formData.ca_id2.substring(0, 2) : '');
    if (!parentId) return [];

    return categories
      .filter(
        (category) =>
          category.ca_id.length === 4 && // 2차 카테고리만
          category.ca_id.startsWith(parentId), // 선택된 1차 카테고리의 하위
      )
      .map((category) => (
        <SelectItem key={category.ca_id} value={category.ca_id}>
          {category.ca_name}
        </SelectItem>
      ));
  };

  // 3차 카테고리 옵션 렌더링
  const renderThirdCategoryOptions = () => {
    // 2차 카테고리가 선택되어 있거나, 기존에 3차 카테고리가 있는 경우
    const parentId = formData.ca_id2 || (formData.ca_id3 ? formData.ca_id3.substring(0, 4) : '');
    if (!parentId) return [];

    return categories
      .filter(
        (category) =>
          category.ca_id.length === 6 && // 3차 카테고리만
          category.ca_id.startsWith(parentId), // 선택된 2차 카테고리의 하위
      )
      .map((category) => (
        <SelectItem key={category.ca_id} value={category.ca_id}>
          {category.ca_name}
        </SelectItem>
      ));
  };

  return loading ? (
    <div className='flex min-h-[calc(100vh-64px)] items-center justify-center'>
      <LoadingSpinner size='lg' message='작품 정보를 불러오는 중...' />
    </div>
  ) : !artwork ? (
    <div className='flex min-h-screen items-center justify-center bg-gray-50'>
      <div className='text-lg text-red-600'>작품을 찾을 수 없습니다.</div>
    </div>
  ) : (
    <div className='mb-20 min-h-screen'>
      <div>
        <div className='mb-6 flex items-center justify-between'>
          <div className='flex items-center space-x-4'>
            <Link href={ROUTES.ADMIN_REVIEW}>
              <Button variant='outline' size='sm'>
                <ArrowLeft className='h-4 w-4' />
              </Button>
            </Link>
            <h1 className='text-2xl font-bold text-gray-900'>작품 설정</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>작품분류</CardTitle>
              <p className='text-sm text-gray-600'>
                기본분류는 반드시 선택하셔야 합니다. 하나의 작품에 최대 3개의 다른 분류를 지정할 수
                있습니다.
              </p>
              <p className='text-xs text-gray-500'>
                2차, 3차 분류는 선택사항이며, 1차 카테고리를 선택해야 2차, 3차 카테고리를 선택할 수
                있습니다.
              </p>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-3 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='ca_id'>
                    기본분류<span className='text-red-500'>*</span>
                  </Label>
                  <Select
                    value={formData.ca_id}
                    onValueChange={(value) => handleCategoryChange('ca_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='1차 카테고리를 선택하세요' />
                    </SelectTrigger>
                    <SelectContent>{renderFirstCategoryOptions()}</SelectContent>
                  </Select>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='ca_id2'>2차 분류</Label>
                  <Select
                    value={formData.ca_id2 || 'none'}
                    onValueChange={(value) =>
                      handleCategoryChange('ca_id2', value === 'none' ? '' : value)
                    }
                    disabled={!formData.ca_id && !formData.ca_id2}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          !formData.ca_id && !formData.ca_id2
                            ? '먼저 기본분류를 선택해주세요'
                            : '2차 카테고리를 선택하세요'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='none'>선택안함</SelectItem>
                      {renderSecondCategoryOptions()}
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='ca_id3'>3차 분류</Label>
                  <Select
                    value={formData.ca_id3 || 'none'}
                    onValueChange={(value) =>
                      handleCategoryChange('ca_id3', value === 'none' ? '' : value)
                    }
                    disabled={!formData.ca_id2 && !formData.ca_id3}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          !formData.ca_id && !formData.ca_id2 && !formData.ca_id3
                            ? '먼저 기본분류를 선택해주세요'
                            : !formData.ca_id2 && !formData.ca_id3
                              ? '먼저 2차 분류를 선택해주세요'
                              : '3차 카테고리를 선택하세요'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='none'>선택안함</SelectItem>
                      {renderThirdCategoryOptions()}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>기본정보</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-3 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='it_name'>
                    작품명<span className='text-red-500'>*</span>
                  </Label>
                  <Input
                    id='it_name'
                    value={formData.it_name}
                    onChange={(e) => handleInputChange('it_name', e.target.value)}
                    placeholder='작품명을 입력하세요'
                    required
                  />
                  <p className='text-xs text-gray-500'>고객에게 표시될 작품의 제목을 입력하세요.</p>
                </div>
                <div className='space-y-2'>
                  <Label>작품 코드</Label>
                  <p className='text-sm font-medium text-gray-900'>{artworkId}</p>
                  <p className='text-xs text-gray-500'>
                    시스템에서 자동으로 생성된 작품의 고유 식별번호입니다.
                  </p>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='it_1'>판매자ID</Label>
                  <p className='text-sm font-medium text-gray-900'>{formData.it_1 || '-'}</p>
                  <p className='text-xs text-gray-500'>이 작품을 등록한 판매자의 ID입니다.</p>
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='it_4'>목표 좋아요 수</Label>
                  <Input
                    id='it_4'
                    type='number'
                    min='0'
                    value={formData.it_4}
                    onChange={(e) => handleInputChange('it_4', parseInt(e.target.value) || 0)}
                    placeholder='목표 좋아요 수'
                  />
                  <p className='text-xs text-gray-500'>작품의 목표 좋아요 수를 설정하세요.</p>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='it_order'>출력순서</Label>
                  <Input
                    id='it_order'
                    type='number'
                    value={formData.it_order}
                    onChange={(e) => handleInputChange('it_order', parseInt(e.target.value) || 0)}
                    placeholder='숫자가 작을수록 상위에 출력'
                  />
                  <p className='text-xs text-gray-500'>
                    작품 목록에서의 정렬 순서를 설정합니다. 숫자가 작을수록 상위에 표시됩니다.
                  </p>
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='it_3'>작품설명</Label>
                <Textarea
                  id='it_3'
                  value={formData.it_3}
                  onChange={(e) => handleInputChange('it_3', e.target.value)}
                  placeholder='작품에 대한 상세 설명을 입력하세요'
                  rows={4}
                />
                <p className='text-xs text-gray-500'>
                  고객에게 표시될 작품의 상세 설명을 입력하세요.
                </p>
              </div>

              <div className='grid grid-cols-3 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='it_sell_email'>판매자 이메일</Label>
                  <Input
                    id='it_sell_email'
                    type='email'
                    value={formData.it_sell_email}
                    onChange={(e) => handleInputChange('it_sell_email', e.target.value)}
                    placeholder='판매자 이메일'
                  />
                  <p className='text-xs text-gray-500'>판매자의 이메일 주소를 입력하세요.</p>
                </div>
                <div className='space-y-2'>
                  <div className='flex items-center space-x-2 pt-6'>
                    <Checkbox
                      id='it_use'
                      checked={formData.it_use === 1}
                      onCheckedChange={(checked) => handleCheckboxChange('it_use', checked)}
                    />
                    <Label htmlFor='it_use'>판매가능</Label>
                  </div>
                  <p className='text-xs text-gray-500'>체크 해제 시 고객이 구매할 수 없습니다.</p>
                </div>
                <div className='space-y-2'>
                  <div className='flex items-center space-x-2 pt-6'>
                    <Checkbox
                      id='it_nocoupon'
                      checked={formData.it_nocoupon === 1}
                      onCheckedChange={(checked) => handleCheckboxChange('it_nocoupon', checked)}
                    />
                    <Label htmlFor='it_nocoupon'>쿠폰적용안함</Label>
                  </div>
                  <p className='text-xs text-gray-500'>체크 시 할인쿠폰을 사용할 수 없습니다.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>가격 및 재고</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-3 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='it_price'>판매가격</Label>
                  <div className='flex items-center space-x-2'>
                    <Input
                      id='it_price'
                      type='number'
                      min='0'
                      value={formData.it_price}
                      onChange={(e) => handleInputChange('it_price', parseInt(e.target.value) || 0)}
                      placeholder='0'
                    />
                    <span className='text-sm text-gray-500'>원</span>
                  </div>
                  <p className='text-xs text-gray-500'>
                    고객에게 판매할 가격을 원 단위로 입력하세요.
                  </p>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='it_point_type'>포인트 유형</Label>
                  <Select
                    value={formData.it_point_type.toString()}
                    onValueChange={(value) => handleInputChange('it_point_type', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='0'>설정금액</SelectItem>
                      <SelectItem value='1'>판매가기준 설정비율</SelectItem>
                      <SelectItem value='2'>구매가기준 설정비율</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className='text-xs text-gray-500'>
                    고객이 작품 구매 시 받을 포인트의 계산 방식을 선택하세요.
                  </p>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='it_point'>포인트</Label>
                  <div className='flex items-center space-x-2'>
                    <Input
                      id='it_point'
                      type='number'
                      min='0'
                      value={formData.it_point}
                      onChange={(e) => handleInputChange('it_point', parseInt(e.target.value) || 0)}
                      placeholder='0'
                    />
                    <span className='text-sm text-gray-500'>
                      {formData.it_point_type > 0 ? '%' : '점'}
                    </span>
                  </div>
                  <p className='text-xs text-gray-500'>
                    {formData.it_point_type === 0
                      ? '고정 포인트 금액을 입력하세요.'
                      : '포인트 적립 비율을 퍼센트로 입력하세요.'}
                  </p>
                </div>
              </div>

              <div className='grid grid-cols-4 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='it_stock_qty'>재고수량</Label>
                  <div className='flex items-center space-x-2'>
                    <Input
                      id='it_stock_qty'
                      type='number'
                      min='0'
                      value={formData.it_stock_qty}
                      onChange={(e) =>
                        handleInputChange('it_stock_qty', parseInt(e.target.value) || 0)
                      }
                      placeholder='0'
                    />
                    <span className='text-sm text-gray-500'>개</span>
                  </div>
                  <p className='text-xs text-gray-500'>
                    판매 가능한 작품의 재고 수량을 입력하세요. 0으로 설정 시 품절로 표시됩니다.
                  </p>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='it_noti_qty'>재고 통보수량</Label>
                  <div className='flex items-center space-x-2'>
                    <Input
                      id='it_noti_qty'
                      type='number'
                      min='0'
                      value={formData.it_noti_qty}
                      onChange={(e) =>
                        handleInputChange('it_noti_qty', parseInt(e.target.value) || 0)
                      }
                      placeholder='0'
                    />
                    <span className='text-sm text-gray-500'>개</span>
                  </div>
                  <p className='text-xs text-gray-500'>
                    재고가 이 수량 이하로 떨어지면 재고 부족 알림을 표시합니다.
                  </p>
                </div>
                <div className='space-y-2'>
                  <div className='flex items-center space-x-2 pt-6'>
                    <Checkbox
                      id='it_soldout'
                      checked={formData.it_soldout === 1}
                      onCheckedChange={(checked) => handleCheckboxChange('it_soldout', checked)}
                    />
                    <Label htmlFor='it_soldout'>품절</Label>
                  </div>
                  <p className='text-xs text-gray-500'>
                    체크 시 품절 상태로 표시되어 구매할 수 없습니다.
                  </p>
                </div>
                <div className='space-y-2'>
                  <div className='flex items-center space-x-2 pt-6'>
                    <Checkbox
                      id='it_stock_sms'
                      checked={formData.it_stock_sms === 1}
                      onCheckedChange={(checked) => handleCheckboxChange('it_stock_sms', checked)}
                    />
                    <Label htmlFor='it_stock_sms'>재입고 SMS</Label>
                  </div>
                  <p className='text-xs text-gray-500'>체크 시 재입고 알림 기능을 활성화합니다.</p>
                </div>
              </div>

              <div className='grid grid-cols-3 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='it_buy_min_qty'>최소구매수량</Label>
                  <div className='flex items-center space-x-2'>
                    <Input
                      id='it_buy_min_qty'
                      type='number'
                      min='0'
                      value={formData.it_buy_min_qty}
                      onChange={(e) =>
                        handleInputChange('it_buy_min_qty', parseInt(e.target.value) || 0)
                      }
                      placeholder='0'
                    />
                    <span className='text-sm text-gray-500'>개</span>
                  </div>
                  <p className='text-xs text-gray-500'>
                    작품 구매 시 최소 구매 수량을 설정합니다. (0은 제한 없음)
                  </p>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='it_buy_max_qty'>최대구매수량</Label>
                  <div className='flex items-center space-x-2'>
                    <Input
                      id='it_buy_max_qty'
                      type='number'
                      min='0'
                      value={formData.it_buy_max_qty}
                      onChange={(e) =>
                        handleInputChange('it_buy_max_qty', parseInt(e.target.value) || 0)
                      }
                      placeholder='0'
                    />
                    <span className='text-sm text-gray-500'>개</span>
                  </div>
                  <p className='text-xs text-gray-500'>
                    작품 구매 시 최대 구매 수량을 설정합니다. (0은 제한 없음)
                  </p>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='it_notax'>과세 유형</Label>
                  <Select
                    value={formData.it_notax.toString()}
                    onValueChange={(value) => handleInputChange('it_notax', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='0'>과세</SelectItem>
                      <SelectItem value='1'>비과세</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className='text-xs text-gray-500'>
                    작품의 과세유형(과세, 비과세)을 설정합니다.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>배송비</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='it_sc_type'>배송비 유형</Label>
                  <Select
                    value={formData.it_sc_type.toString()}
                    onValueChange={(value) => handleInputChange('it_sc_type', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='0'>쇼핑몰 기본설정 사용</SelectItem>
                      <SelectItem value='1'>무료배송</SelectItem>
                      <SelectItem value='2'>조건부 무료배송</SelectItem>
                      <SelectItem value='3'>유료배송</SelectItem>
                      <SelectItem value='4'>수량별 부과</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className='text-xs text-gray-500'>이 작품의 배송비 계산 방식을 선택하세요.</p>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='it_sc_method'>배송비 결제</Label>
                  <Select
                    value={formData.it_sc_method.toString()}
                    onValueChange={(value) => handleInputChange('it_sc_method', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='0'>선불</SelectItem>
                      <SelectItem value='1'>착불</SelectItem>
                      <SelectItem value='2'>사용자선택</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className='text-xs text-gray-500'>배송비 결제 방식을 선택하세요.</p>
                </div>
              </div>

              {formData.it_sc_type > 1 && (
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='it_sc_price'>기본배송비</Label>
                    <div className='flex items-center space-x-2'>
                      <Input
                        id='it_sc_price'
                        type='number'
                        min='0'
                        value={formData.it_sc_price}
                        onChange={(e) =>
                          handleInputChange('it_sc_price', parseInt(e.target.value) || 0)
                        }
                        placeholder='0'
                      />
                      <span className='text-sm text-gray-500'>원</span>
                    </div>
                    <p className='text-xs text-gray-500'>
                      기본 배송비 금액을 원 단위로 입력하세요.
                    </p>
                  </div>
                  {formData.it_sc_type === 2 && (
                    <div className='space-y-2'>
                      <Label htmlFor='it_sc_minimum'>무료배송 최소금액</Label>
                      <div className='flex items-center space-x-2'>
                        <Input
                          id='it_sc_minimum'
                          type='number'
                          min='0'
                          value={formData.it_sc_minimum}
                          onChange={(e) =>
                            handleInputChange('it_sc_minimum', parseInt(e.target.value) || 0)
                          }
                          placeholder='0'
                        />
                        <span className='text-sm text-gray-500'>원 이상</span>
                      </div>
                      <p className='text-xs text-gray-500'>
                        이 금액 이상 주문 시 배송비가 무료가 됩니다.
                      </p>
                    </div>
                  )}
                  {formData.it_sc_type === 4 && (
                    <div className='space-y-2'>
                      <Label htmlFor='it_sc_qty'>수량별 배송비</Label>
                      <div className='flex items-center space-x-2'>
                        <Input
                          id='it_sc_qty'
                          type='number'
                          min='0'
                          value={formData.it_sc_qty}
                          onChange={(e) =>
                            handleInputChange('it_sc_qty', parseInt(e.target.value) || 0)
                          }
                          placeholder='0'
                        />
                        <span className='text-sm text-gray-500'>개마다</span>
                      </div>
                      <p className='text-xs text-gray-500'>
                        설정한 수량마다 기본배송비가 추가로 부과됩니다.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>작품 이미지</CardTitle>
              <p className='text-sm text-gray-600'>
                대표 이미지 1개(필수)와 추가 이미지 최대 3개까지 업로드할 수 있습니다.
              </p>
              <p className='text-xs text-gray-500'>
                권장 이미지 크기: 800x800px 이상, PNG, JPG, JPEG 형식 지원, 각 파일 최대 5MB
              </p>
            </CardHeader>
            <CardContent className='space-y-4'>
              {[1, 2, 3, 4].map((imageIndex) => {
                const imageSrc = getImageSrc(imageIndex);
                const key = `it_img${imageIndex}`;
                const hasExistingImage = artwork && artwork[key as keyof ArtworkDetail];
                const isImageDeleted = imagesToDelete.includes(key);
                const shouldShowImage = imageSrc && !isImageDeleted;
                const isMainImage = imageIndex === 1;
                const imageLabel = isMainImage ? '대표 이미지' : `추가 이미지 ${imageIndex - 1}`;

                return (
                  <div key={imageIndex} className='space-y-3 rounded-lg border p-4'>
                    <div>
                      <Label htmlFor={`image_${imageIndex}`} className='text-sm font-medium'>
                        {imageLabel} {isMainImage && <span className='text-red-500'>*</span>}
                      </Label>
                    </div>

                    <div className='space-y-3'>
                      <Input
                        id={`image_${imageIndex}`}
                        type='file'
                        accept='image/*'
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          handleImageUpload(imageIndex, file);
                        }}
                        className='cursor-pointer file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100'
                      />

                      {hasExistingImage && (
                        <div className='flex items-center space-x-2'>
                          <Checkbox
                            id={`delete_${key}`}
                            checked={imagesToDelete.includes(key)}
                            onCheckedChange={(checked) => handleImageDelete(imageIndex, checked)}
                          />
                          <Label
                            htmlFor={`delete_${key}`}
                            className='cursor-pointer text-sm text-red-600'
                          >
                            기존 이미지 삭제
                          </Label>
                        </div>
                      )}

                      {shouldShowImage && (
                        <div className='mt-3 rounded-lg bg-gray-50 p-3'>
                          <div className='text-center'>
                            <div className='relative h-64 w-full'>
                              <Image
                                src={imageSrc}
                                alt={`이미지 ${imageIndex} 미리보기`}
                                fill
                                className='rounded-lg object-contain shadow-sm'
                                unoptimized={
                                  imageSrc.startsWith('data:') || imageSrc.startsWith('blob:')
                                }
                              />
                            </div>
                            <p className='mt-2 text-xs text-gray-500'>
                              {imageFiles[key] ? '새로 업로드된 이미지' : '현재 등록된 이미지'}
                            </p>
                          </div>
                        </div>
                      )}

                      {isImageDeleted && hasExistingImage && (
                        <div className='mt-3 rounded-lg border border-red-200 bg-red-50 p-3'>
                          <div className='flex items-center space-x-2 text-sm text-red-600'>
                            <span>이 이미지는 저장 시 삭제됩니다</span>
                          </div>
                        </div>
                      )}

                      {!shouldShowImage && !isImageDeleted && (
                        <div className='mt-3 rounded-lg border-2 border-dashed border-gray-300 bg-gray-100 p-3'>
                          <div className='flex items-center justify-center space-x-2 text-sm text-gray-500'>
                            <span>이미지를 선택해주세요</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

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
      </div>
    </div>
  );
}
