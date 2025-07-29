'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/primitives/dialog';
import { Dictionary } from '@/lib/dictionaries';

interface ImageMagnifierModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  productName: string;
  dictionary: Dictionary;
}

interface MagnifierPosition {
  x: number;
  y: number;
}

const zoomLevel = 2.5; // 확대 비율
const magnifierSize = 150; // 돋보기 크기

export default function ImageMagnifierModal({
  open,
  onOpenChange,
  imageUrl,
  productName,
  dictionary,
}: ImageMagnifierModalProps) {
  const [showMagnifier, setShowMagnifier] = useState<boolean>(false);
  const [magnifierPosition, setMagnifierPosition] = useState<MagnifierPosition>({
    x: 0,
    y: 0,
  });
  const [magnifierBackground, setMagnifierBackground] = useState<MagnifierPosition>({
    x: 0,
    y: 0,
  });

  const imageRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = useCallback(() => {
    setShowMagnifier(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setShowMagnifier(false);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 돋보기 위치 (마우스 중앙에 오도록)
    const magnifierX = x - magnifierSize / 2;
    const magnifierY = y - magnifierSize / 2;

    // 이미지 내에서의 비율 계산
    const ratioX = x / rect.width;
    const ratioY = y / rect.height;

    // 확대된 이미지에서의 배경 위치 계산
    const bgX = -(ratioX * rect.width * zoomLevel - magnifierSize / 2);
    const bgY = -(ratioY * rect.height * zoomLevel - magnifierSize / 2);

    setMagnifierPosition({ x: magnifierX, y: magnifierY });
    setMagnifierBackground({ x: bgX, y: bgY });
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-4xl p-6'>
        <DialogHeader>
          <DialogTitle>
            {productName} - {dictionary.productDetail.imageMagnifier.title}
          </DialogTitle>
        </DialogHeader>

        <div className='relative'>
          <div
            ref={imageRef}
            className='relative aspect-square w-full cursor-crosshair overflow-hidden rounded-lg bg-gray-100'
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseMove={handleMouseMove}
          >
            <Image
              src={imageUrl}
              alt={productName}
              fill
              className='object-cover'
              sizes='(max-width: 768px) 100vw, 80vw'
            />

            {showMagnifier && imageRef.current && (
              <div
                className='pointer-events-none absolute z-10 h-[150px] w-[150px] rounded-full border-4 border-white bg-gray-100 bg-no-repeat shadow-[0_0_0_3px_rgba(255,255,255,0.5),_0_0_10px_rgba(0,0,0,0.5)]'
                style={{
                  left: `${magnifierPosition.x}px`,
                  top: `${magnifierPosition.y}px`,
                  backgroundImage: `url(${imageUrl})`,
                  backgroundSize: `${imageRef.current.offsetWidth * zoomLevel}px ${imageRef.current.offsetHeight * zoomLevel}px`,
                  backgroundPosition: `${magnifierBackground.x}px ${magnifierBackground.y}px`,
                }}
              />
            )}
          </div>

          <div className='mt-4 text-center text-sm text-gray-600'>
            {dictionary.productDetail.imageMagnifier.instruction}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
