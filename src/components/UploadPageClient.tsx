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
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { FiUpload, FiX, FiPlus } from 'react-icons/fi';
import { CATEGORY_IDS } from '@/lib/constants';
import { ROUTES } from '@/lib/routes';
import { termsOfService } from '@/lib/terms-content';
import { Dictionary } from '@/lib/dictionaries';

interface UploadedFile {
  file: File;
  preview: string;
}

const getCategoriesWithDictionary = (dictionary: Dictionary) => [
  { ca_id: CATEGORY_IDS.FASHION, ca_name: dictionary.shop.categories.fashion },
  { ca_id: CATEGORY_IDS.SHOES, ca_name: dictionary.shop.categories.shoes },
  { ca_id: CATEGORY_IDS.OTHERS, ca_name: dictionary.shop.categories.others },
];

interface UploadPageClientProps {
  dictionary: Dictionary;
}

export default function UploadPageClient({ dictionary }: UploadPageClientProps) {
  const CATEGORIES = getCategoriesWithDictionary(dictionary);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [mainImage, setMainImage] = useState<UploadedFile | null>(null);
  const [additionalImages, setAdditionalImages] = useState<UploadedFile[]>([]);
  const [showLoginDialog, setShowLoginDialog] = useState<boolean>(false);
  const [showMessageDialog, setShowMessageDialog] = useState<boolean>(false);
  const [showFinalConfirmDialog, setShowFinalConfirmDialog] = useState<boolean>(false);
  const [messageDialogData, setMessageDialogData] = useState({
    title: '',
    description: '',
    onConfirm: () => {},
  });
  const [formData, setFormData] = useState({
    category: '',
    artworkName: '',
    description: '',
    targetLikes: '',
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
      showMessage(
        dictionary.upload.messages.fileSizeExceeded,
        dictionary.upload.messages.fileSizeExceededDesc,
      );
      return;
    }

    // 이미지 파일인지 확인
    if (!file.type.match('image.*')) {
      showMessage(
        dictionary.upload.messages.invalidFileType,
        dictionary.upload.messages.invalidFileTypeDesc,
      );
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
      showMessage(
        dictionary.upload.messages.fileSizeExceeded,
        dictionary.upload.messages.fileSizeExceededDesc,
      );
      return;
    }

    // 이미지 파일인지 확인
    if (!file.type.match('image.*')) {
      showMessage(
        dictionary.upload.messages.invalidFileType,
        dictionary.upload.messages.invalidFileTypeDesc,
      );
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

  const handleActualUpload = async () => {
    setIsUploading(true);

    try {
      const uploadData = new FormData();

      // 기본 정보
      uploadData.append('category', formData.category);
      uploadData.append('artworkName', formData.artworkName);
      uploadData.append('description', formData.description);
      uploadData.append('targetLikes', formData.targetLikes.toString());

      // 대표 이미지
      uploadData.append('mainImage', mainImage!.file);

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
          dictionary.upload.messages.uploadSuccess,
          dictionary.upload.messages.uploadSuccessDesc,
          () => router.push(ROUTES.SHOP),
        );
      } else {
        showMessage(
          dictionary.upload.messages.uploadFailed,
          result.message || dictionary.upload.messages.uploadFailedDesc,
        );
      }
    } catch (error) {
      console.error('Upload error:', error);
      showMessage(
        dictionary.upload.messages.uploadError,
        dictionary.upload.messages.uploadFailedDesc,
      );
    } finally {
      setIsUploading(false);
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
      showMessage(
        dictionary.upload.messages.mainImageRequired,
        dictionary.upload.messages.mainImageRequiredDesc,
      );
      return;
    }

    if (!formData.category) {
      showMessage(
        dictionary.upload.messages.categoryRequired,
        dictionary.upload.messages.categoryRequiredDesc,
      );
      return;
    }

    if (!formData.artworkName.trim()) {
      showMessage(
        dictionary.upload.messages.artworkNameRequired,
        dictionary.upload.messages.artworkNameRequiredDesc,
      );
      return;
    }

    if (!formData.description.trim()) {
      showMessage(
        dictionary.upload.messages.descriptionRequired,
        dictionary.upload.messages.descriptionRequiredDesc,
      );
      return;
    }

    if (!formData.agreeToTerms) {
      showMessage(
        dictionary.upload.messages.termsRequired,
        dictionary.upload.messages.termsRequiredDesc,
      );
      return;
    }

    // 최종 확인 다이얼로그 표시
    setShowFinalConfirmDialog(true);
  };

  return (
    <div className='min-h-screen px-6 py-8 sm:px-10'>
      <div>
        <div className='mb-8'>
          <Image
            src='/images/upload-bg.png'
            alt={dictionary.upload.form.mainImage}
            width={1200}
            height={400}
            className='w-full rounded-lg object-cover'
            priority
          />
        </div>

        <Card className='mb-8'>
          <CardContent className='p-8'>
            <h2 className='mb-6 text-center text-2xl font-bold'>{dictionary.upload.title}</h2>

            <div className='space-y-6'>
              <p className='text-center text-gray-600'>
                {dictionary.upload.subtitle}
                <br />
                {dictionary.upload.checkBeforeUpload}
              </p>

              <div className='space-y-4'>
                <div className='border-l-4 border-red-500 pl-4'>
                  <h3 className='mb-2 font-semibold text-red-600'>
                    {dictionary.upload.requiredCheck}
                  </h3>
                </div>

                <div className='space-y-4 text-sm text-gray-600'>
                  <div>
                    <h4 className='font-semibold text-gray-800'>
                      {dictionary.upload.guidelines.item1.title}
                    </h4>
                    <p>{dictionary.upload.guidelines.item1.content}</p>
                  </div>

                  <div>
                    <h4 className='font-semibold text-gray-800'>
                      {dictionary.upload.guidelines.item2.title}
                    </h4>
                    <p>{dictionary.upload.guidelines.item2.content}</p>
                  </div>

                  <div>
                    <h4 className='font-semibold text-gray-800'>
                      {dictionary.upload.guidelines.item3.title}
                    </h4>
                    <p className='whitespace-pre-line'>
                      {dictionary.upload.guidelines.item3.content}
                    </p>
                  </div>

                  <div>
                    <h4 className='font-semibold text-gray-800'>
                      {dictionary.upload.guidelines.item4.title}
                    </h4>
                    <p>{dictionary.upload.guidelines.item4.content}</p>
                  </div>

                  <div>
                    <h4 className='font-semibold text-gray-800'>
                      {dictionary.upload.guidelines.item5.title}
                    </h4>
                    <p>{dictionary.upload.guidelines.item5.content}</p>
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
                        {dictionary.upload.form.mainImage}{' '}
                        <span className='text-red-500'>{dictionary.upload.form.required}</span>
                      </Label>
                    </div>

                    <div className='rounded-lg border-2 border-dashed border-gray-300 p-6 text-center'>
                      {mainImage ? (
                        <div className='relative'>
                          <Image
                            src={mainImage.preview}
                            alt={dictionary.upload.form.mainImage}
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
                              {dictionary.upload.form.selectMainImage}
                            </Button>
                            <p className='mt-3 text-sm whitespace-pre-line text-gray-500'>
                              {dictionary.upload.form.imageSpecs}
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
                      {dictionary.upload.form.additionalImageCount.replace(
                        '{{count}}',
                        additionalImages.length.toString(),
                      )}
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
                                alt={`${dictionary.upload.form.additionalImages} ${index + 1}`}
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
                                {dictionary.upload.form.imageNumber.replace(
                                  '{{number}}',
                                  (index + 1).toString(),
                                )}
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

                    <p className='text-center text-sm whitespace-pre-line text-gray-500'>
                      {dictionary.upload.form.additionalImageSpecs}
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
                      {dictionary.upload.form.category}{' '}
                      <span className='text-red-500'>{dictionary.upload.form.required}</span>
                    </Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, category: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={dictionary.upload.form.selectCategory} />
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
                      {dictionary.upload.form.artworkName}{' '}
                      <span className='text-red-500'>{dictionary.upload.form.required}</span>
                    </Label>
                    <Input
                      id='artworkName'
                      value={formData.artworkName}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, artworkName: e.target.value }))
                      }
                      placeholder={dictionary.upload.form.artworkNamePlaceholder}
                      className='w-full'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='description' className='text-lg font-semibold'>
                      {dictionary.upload.form.description}{' '}
                      <span className='text-red-500'>{dictionary.upload.form.required}</span>
                    </Label>
                    <Textarea
                      id='description'
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, description: e.target.value }))
                      }
                      placeholder={dictionary.upload.form.descriptionPlaceholder}
                      className='min-h-32'
                    />
                  </div>

                  <div className='space-y-4'>
                    <Label className='text-lg font-semibold'>
                      {dictionary.upload.form.terms}{' '}
                      <span className='text-red-500'>{dictionary.upload.form.required}</span>
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
                        {dictionary.upload.form.agreeToTerms}
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
                {isUploading
                  ? dictionary.upload.form.uploading
                  : dictionary.upload.form.uploadButton}
              </Button>
            </div>
          </div>
        </form>
      </div>

      <LoginRequiredDialog
        open={showLoginDialog}
        onOpenChange={setShowLoginDialog}
        title={dictionary.upload.loginRequired.title}
        description={dictionary.upload.loginRequired.description}
        dictionary={dictionary}
      />

      <MessageDialog
        open={showMessageDialog}
        onOpenChange={setShowMessageDialog}
        title={messageDialogData.title}
        description={messageDialogData.description}
        onConfirm={messageDialogData.onConfirm}
        dictionary={dictionary}
      />

      <ConfirmDialog
        open={showFinalConfirmDialog}
        onOpenChange={setShowFinalConfirmDialog}
        title={dictionary.upload.messages.finalConfirmTitle}
        description={dictionary.upload.messages.finalConfirmDesc}
        dictionary={dictionary}
        variant='default'
        onConfirm={handleActualUpload}
      />
    </div>
  );
}
