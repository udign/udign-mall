import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { verifyToken } from '@/lib/auth';
import { getFileExtension } from '@/lib/utils';

export const POST = async (request: NextRequest) => {
  try {
    // 인증 확인 (관리자만 허용)
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const decoded = verifyToken(token) as { mb_id: string; mb_no: number; mb_level: number } | null;
    if (!decoded || !decoded.mb_id || decoded.mb_level < 10) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
    }

    // FormData에서 데이터 추출
    const formData = await request.formData();
    const image = formData.get('image') as File;
    const popupId = formData.get('popupId') as string;

    // 유효성 검사
    if (!image || !popupId) {
      return NextResponse.json(
        {
          success: false,
          message: '이미지 파일과 팝업 ID가 필요합니다.',
        },
        { status: 400 },
      );
    }

    // 파일 크기 검증 (5MB 제한)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (image.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          message: '이미지 용량이 5MB를 초과합니다.',
        },
        { status: 400 },
      );
    }

    // 파일 확장자 검증
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(image.type)) {
      return NextResponse.json(
        {
          success: false,
          message: '지원되지 않는 이미지 형식입니다. (JPG, JPEG, PNG, GIF, WebP만 허용)',
        },
        { status: 400 },
      );
    }

    // 고유한 파일명 생성 (타임스탬프 + 랜덤)
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const extension = getFileExtension(image.name);
    const fileName = `image_${timestamp}_${randomId}.${extension}`;

    try {
      // Vercel Storage에 이미지 업로드
      const blob = await put(`popup/${popupId}/${fileName}`, image, {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });

      return NextResponse.json({
        success: true,
        imageUrl: blob.url,
        message: '이미지가 성공적으로 업로드되었습니다.',
      });
    } catch (uploadError) {
      console.error('Vercel Storage 업로드 오류:', uploadError);
      return NextResponse.json(
        {
          success: false,
          message: '이미지 업로드 중 오류가 발생했습니다.',
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('팝업 이미지 업로드 API 오류:', error);
    return NextResponse.json(
      {
        success: false,
        message: '서버 오류가 발생했습니다.',
      },
      { status: 500 },
    );
  }
};
