import React from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/primitives/input';
import { Label } from '@/components/ui/primitives/label';
import { Checkbox } from '@/components/ui/primitives/checkbox';
import { ArtworkDetail } from '@/types/artwork';

interface ArtworkImageUploadItemProps {
  imageIndex: number;
  artwork: ArtworkDetail | null;
  imageFiles: { [key: string]: File | null };
  imagesToDelete: string[];
  onImageUpload: (imageIndex: number, file: File | null) => void;
  onImageDelete: (imageIndex: number, checked: boolean | 'indeterminate') => void;
  getImageSrc: (imageIndex: number) => string | null;
}

export default function ArtworkImageUploadItem({
  imageIndex,
  artwork,
  imageFiles,
  imagesToDelete,
  onImageUpload,
  onImageDelete,
  getImageSrc,
}: ArtworkImageUploadItemProps) {
  const imageSrc = getImageSrc(imageIndex);
  const key = `it_img${imageIndex}`;
  const hasExistingImage = artwork && artwork[key as keyof ArtworkDetail];
  const isImageDeleted = imagesToDelete.includes(key);
  const shouldShowImage = imageSrc && !isImageDeleted;
  const isMainImage = imageIndex === 1;
  const imageLabel = isMainImage ? '대표 이미지' : `추가 이미지 ${imageIndex - 1}`;

  return (
    <div className='space-y-3 rounded-lg border p-4'>
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
            onImageUpload(imageIndex, file);
          }}
          className='cursor-pointer file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100'
        />

        {hasExistingImage && (
          <div className='flex items-center space-x-2'>
            <Checkbox
              id={`delete_${key}`}
              checked={imagesToDelete.includes(key)}
              onCheckedChange={(checked) => onImageDelete(imageIndex, checked)}
            />
            <Label htmlFor={`delete_${key}`} className='cursor-pointer text-sm text-red-600'>
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
                  unoptimized={imageSrc.startsWith('data:') || imageSrc.startsWith('blob:')}
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
}
