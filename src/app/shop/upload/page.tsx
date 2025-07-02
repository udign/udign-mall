'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/primitives/button';
import { Card, CardContent } from '@/components/ui/primitives/card';
import { Label } from '@/components/ui/primitives/label';
import { Input } from '@/components/ui/primitives/input';
import { Textarea } from '@/components/ui/primitives/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/primitives/select';
import { Checkbox } from '@/components/ui/primitives/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import LoginRequiredDialog from '@/components/LoginRequiredDialog';
import MessageDialog from '@/components/ui/MessageDialog';
import { FiUpload, FiX, FiPlus } from 'react-icons/fi';
import { CATEGORY_IDS } from '@/lib/constants';
import { ROUTES } from '@/lib/routes';
import { termsOfService } from '@/lib/terms-content';

interface UploadedFile {
  file: File;
  preview: string;
}

const CATEGORIES = [
  { ca_id: CATEGORY_IDS.FASHION, ca_name: 'fashion' },
  { ca_id: CATEGORY_IDS.SHOES, ca_name: 'shoes' },
  { ca_id: CATEGORY_IDS.OTHERS, ca_name: 'others' },
];

export default function UploadPage() {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [mainImage, setMainImage] = useState<UploadedFile | null>(null);
  const [additionalImages, setAdditionalImages] = useState<UploadedFile[]>([]);
  const [showLoginDialog, setShowLoginDialog] = useState<boolean>(false);
  const [showMessageDialog, setShowMessageDialog] = useState<boolean>(false);
  const [messageDialogData, setMessageDialogData] = useState({
    title: '',
    description: '',
    onConfirm: () => {},
  });
  const [formData, setFormData] = useState({
    category: '',
    artworkName: '',
    description: '',
    agreeToTerms: false,
  });

  const mainImageRef = useRef<HTMLInputElement>(null);
  const additionalImageRefs = useRef<HTMLInputElement[]>([]);

  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      setShowLoginDialog(true);
    }
  }, [user, isLoading]);

  const showMessage = (title: string, description?: string, onConfirm?: () => void) => {
    setMessageDialogData({
      title,
      description: description || '',
      onConfirm: onConfirm || (() => {}),
    });
    setShowMessageDialog(true);
  };

  const handleMainImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 크기 체크 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showMessage('파일 용량 초과', '파일 용량은 5MB 이하여야 합니다.');
      return;
    }

    // 이미지 파일인지 확인
    if (!file.type.match('image.*')) {
      showMessage('파일 형식 오류', '이미지 파일만 업로드 가능합니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setMainImage({
        file,
        preview: e.target?.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleAdditionalImageSelect = (
    event: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 크기 체크 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showMessage('파일 용량 초과', '파일 용량은 5MB 이하여야 합니다.');
      return;
    }

    // 이미지 파일인지 확인
    if (!file.type.match('image.*')) {
      showMessage('파일 형식 오류', '이미지 파일만 업로드 가능합니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const newImages = [...additionalImages];
      newImages[index] = {
        file,
        preview: e.target?.result as string,
      };
      setAdditionalImages(newImages);
    };
    reader.readAsDataURL(file);
  };

  const removeMainImage = () => {
    setMainImage(null);
    if (mainImageRef.current) {
      mainImageRef.current.value = '';
    }
  };

  const removeAdditionalImage = (index: number) => {
    const newImages = [...additionalImages];
    newImages.splice(index, 1);
    setAdditionalImages(newImages);

    if (additionalImageRefs.current[index]) {
      additionalImageRefs.current[index].value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 로그인 체크
    if (!user) {
      setShowLoginDialog(true);
      return;
    }

    // 유효성 검사
    if (!mainImage) {
      showMessage('대표 이미지 필수', '대표 이미지를 선택해주세요.');
      return;
    }

    if (!formData.category) {
      showMessage('카테고리 필수', '카테고리를 선택해주세요.');
      return;
    }

    if (!formData.artworkName.trim()) {
      showMessage('작품명 필수', '작품명을 입력해주세요.');
      return;
    }

    if (!formData.description.trim()) {
      showMessage('작품설명 필수', '작품설명을 입력해주세요.');
      return;
    }

    if (!formData.agreeToTerms) {
      showMessage('약관 동의 필수', '약관에 동의해주세요.');
      return;
    }

    setIsUploading(true);

    try {
      const uploadData = new FormData();

      // 기본 정보
      uploadData.append('category', formData.category);
      uploadData.append('artworkName', formData.artworkName);
      uploadData.append('description', formData.description);

      // 대표 이미지
      uploadData.append('mainImage', mainImage.file);

      // 추가 이미지들
      additionalImages.forEach((imageData, index) => {
        uploadData.append(`additionalImage${index}`, imageData.file);
      });

      const response = await fetch('/api/upload/artwork', {
        method: 'POST',
        body: uploadData,
      });

      const result = await response.json();

      if (result.success) {
        showMessage(
          '업로드 완료',
          '작품이 성공적으로 업로드되었습니다. 관리자 승인 후 사이트에 노출됩니다.',
          () => router.push(ROUTES.SHOP),
        );
      } else {
        showMessage('업로드 실패', result.message || '업로드 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Upload error:', error);
      showMessage('업로드 오류', '업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className='min-h-screen px-6 py-8 sm:px-10'>
      <div>
        <div className='mb-8'>
          <Image
            src='/images/upload-bg.png'
            alt='디자인 업로드'
            width={1200}
            height={400}
            className='w-full rounded-lg object-cover'
            priority
          />
        </div>

        <Card className='mb-8'>
          <CardContent className='p-8'>
            <h2 className='mb-6 text-center text-2xl font-bold'>
              여러분의 소중한 작품을 기다립니다
            </h2>

            <div className='space-y-6'>
              <p className='text-center text-gray-600'>
                디자이너 여러분의 창의적인 디자인을 공유해 주셔서 진심으로 감사드립니다.
                <br />
                디자인 업로드 전 아래의 사항을 꼼꼼히 확인해주시기 바랍니다.
              </p>

              <div className='space-y-4'>
                <div className='border-l-4 border-red-500 pl-4'>
                  <h3 className='mb-2 font-semibold text-red-600'>업로드 전 필수 확인사항</h3>
                </div>

                <div className='space-y-4 text-sm text-gray-600'>
                  <div>
                    <h4 className='font-semibold text-gray-800'>1. 필수 작성 항목 기재</h4>
                    <p>작품 등록 시 제공되는 모든 입력란을 빠짐없이 작성해 주시기 바랍니다.</p>
                  </div>

                  <div>
                    <h4 className='font-semibold text-gray-800'>2. 이미지 업로드 구성</h4>
                    <p>
                      메인 이미지 1개와 서브 이미지 1~3개, 총 최대 4개의 이미지를 업로드 하실 수
                      있습니다.
                    </p>
                  </div>

                  <div>
                    <h4 className='font-semibold text-gray-800'>3. 이미지 규격 및 형식</h4>
                    <p>
                      • 정사각형 비율 필수
                      <br />• 권장 크기: 800 x 800 이상
                      <br />• 용량: 5MB 이하
                      <br />• 형식: PNG, JPG, JPEG
                    </p>
                  </div>

                  <div>
                    <h4 className='font-semibold text-gray-800'>4. 정확한 카테고리 설정</h4>
                    <p>디자인의 성격에 맞는 카테고리를 선택해 주세요.</p>
                  </div>

                  <div>
                    <h4 className='font-semibold text-gray-800'>5. 관리자 승인 후 노출</h4>
                    <p>등록된 작품은 내부 검토 후 노출됩니다. (영업일 기준 2~3일 소요)</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className='space-y-8'>
          <div className='grid grid-cols-1 gap-8 lg:grid-cols-2'>
            <div className='space-y-6'>
              <Card>
                <CardContent className='p-6'>
                  <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                      <Label className='text-lg font-semibold'>
                        대표 이미지 <span className='text-red-500'>*</span>
                      </Label>
                    </div>

                    <div className='rounded-lg border-2 border-dashed border-gray-300 p-6 text-center'>
                      {mainImage ? (
                        <div className='relative'>
                          <Image
                            src={mainImage.preview}
                            alt='대표 이미지 미리보기'
                            width={200}
                            height={200}
                            className='mx-auto rounded-lg object-cover'
                          />
                          <Button
                            type='button'
                            variant='destructive'
                            size='icon'
                            className='absolute top-2 right-2 h-6 w-6'
                            onClick={removeMainImage}
                          >
                            <FiX className='h-2.5 w-2.5' />
                          </Button>
                          <p className='mt-2 text-sm text-gray-600'>{mainImage.file.name}</p>
                        </div>
                      ) : (
                        <div className='space-y-4'>
                          <FiUpload className='mx-auto h-12 w-12 text-gray-400' />
                          <div>
                            <Button
                              type='button'
                              variant='outline'
                              onClick={() => {
                                if (!user) {
                                  setShowLoginDialog(true);
                                  return;
                                }
                                mainImageRef.current?.click();
                              }}
                            >
                              대표 이미지 선택
                            </Button>
                            <p className='mt-3 text-sm text-gray-500'>
                              권장 크기: 800 x 800 이상
                              <br />
                              용량: 5MB 이하
                              <br />
                              PNG, JPG, JPEG
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <input
                      ref={mainImageRef}
                      type='file'
                      accept='image/*'
                      onChange={handleMainImageSelect}
                      className='hidden'
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className='p-6'>
                  <div className='space-y-4'>
                    <Label className='text-lg font-semibold'>
                      추가 이미지 ({additionalImages.length}/3개)
                    </Label>

                    <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
                      {[0, 1, 2].map((index) => (
                        <div
                          key={index}
                          className='min-h-[140px] rounded-lg border-2 border-dashed border-gray-200 p-4 text-center'
                        >
                          {additionalImages[index] ? (
                            <div className='relative'>
                              <Image
                                src={additionalImages[index].preview}
                                alt={`추가 이미지 ${index + 1}`}
                                width={120}
                                height={120}
                                className='mx-auto rounded object-cover'
                              />
                              <Button
                                type='button'
                                variant='destructive'
                                size='icon'
                                className='absolute -top-2 -right-2 h-6 w-6'
                                onClick={() => removeAdditionalImage(index)}
                              >
                                <FiX className='h-2 w-2' />
                              </Button>
                            </div>
                          ) : (
                            <div className='flex h-full flex-col items-center justify-center space-y-2'>
                              <FiPlus className='h-8 w-8 text-gray-400' />
                              <Button
                                type='button'
                                variant='ghost'
                                size='sm'
                                onClick={() => {
                                  if (!user) {
                                    setShowLoginDialog(true);
                                    return;
                                  }
                                  additionalImageRefs.current[index]?.click();
                                }}
                              >
                                이미지 {index + 1}
                              </Button>
                            </div>
                          )}

                          <input
                            ref={(el) => {
                              if (el) additionalImageRefs.current[index] = el;
                            }}
                            type='file'
                            accept='image/*'
                            onChange={(e) => handleAdditionalImageSelect(e, index)}
                            className='hidden'
                          />
                        </div>
                      ))}
                    </div>

                    <p className='text-center text-sm text-gray-500'>
                      권장 크기: 800 x 800 이상
                      <br />
                      용량: 5MB 이하
                      <br />
                      PNG, JPG, JPEG
                      <br />
                      최대 3장까지 선택 가능합니다.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className='space-y-6'>
              <Card>
                <CardContent className='space-y-6 p-6'>
                  <div className='space-y-2'>
                    <Label htmlFor='category' className='text-lg font-semibold'>
                      작품 카테고리 <span className='text-red-500'>*</span>
                    </Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, category: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='작품 카테고리를 선택해주세요.' />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((category) => (
                          <SelectItem key={category.ca_id} value={category.ca_id}>
                            {category.ca_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='artworkName' className='text-lg font-semibold'>
                      작품명 <span className='text-red-500'>*</span>
                    </Label>
                    <Input
                      id='artworkName'
                      value={formData.artworkName}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, artworkName: e.target.value }))
                      }
                      placeholder='작품명'
                      className='w-full'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='description' className='text-lg font-semibold'>
                      작품설명 <span className='text-red-500'>*</span>
                    </Label>
                    <Textarea
                      id='description'
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, description: e.target.value }))
                      }
                      placeholder='작품에 대한 상세한 설명을 입력해주세요.'
                      className='min-h-32'
                    />
                  </div>

                  <div className='space-y-4'>
                    <Label className='text-lg font-semibold'>
                      약관/안내사항 <span className='text-red-500'>*</span>
                    </Label>
                    <div className='h-32 overflow-y-auto rounded-md border border-gray-300 bg-gray-50 px-3 text-sm whitespace-pre-line text-gray-700'>
                      {termsOfService}
                    </div>
                    <div className='flex items-center space-x-2'>
                      <Checkbox
                        id='agreeToTerms'
                        checked={formData.agreeToTerms}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => ({ ...prev, agreeToTerms: checked as boolean }))
                        }
                      />
                      <Label htmlFor='agreeToTerms' className='cursor-pointer text-sm'>
                        약관/안내사항의 내용에 동의합니다.
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button
                type='submit'
                disabled={isUploading}
                className='h-14 w-full text-lg'
                size='lg'
              >
                {isUploading ? '업로드 중...' : '업로드하기'}
              </Button>
            </div>
          </div>
        </form>
      </div>

      <LoginRequiredDialog
        open={showLoginDialog}
        onOpenChange={setShowLoginDialog}
        title='로그인이 필요합니다'
        description='디자인 업로드는 회원만 이용하실 수 있습니다. 로그인 후 이용해 주시기 바랍니다.'
      />

      <MessageDialog
        open={showMessageDialog}
        onOpenChange={setShowMessageDialog}
        title={messageDialogData.title}
        description={messageDialogData.description}
        onConfirm={messageDialogData.onConfirm}
      />
    </div>
  );
}
