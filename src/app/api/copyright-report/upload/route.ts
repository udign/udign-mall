import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { verifyToken } from '@/lib/auth';
import { getFileExtension } from '@/lib/utils';

export const POST = async (request: NextRequest) => {
  try {
    // 인증 확인
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const decoded = verifyToken(token) as { mb_id: string; mb_no: number } | null;
    if (!decoded || !decoded.mb_id) {
      return NextResponse.json({ error: '유효하지 않은 토큰입니다.' }, { status: 401 });
    }

    // FormData에서 파일 추출
    const formData = await request.formData();
    const file = formData.get('file') as File;

    // 유효성 검사
    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: '파일이 필요합니다.',
        },
        { status: 400 },
      );
    }

    // 파일 크기 검증 (5MB 제한)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: '파일 용량이 5MB를 초과합니다.',
        },
        { status: 400 },
      );
    }

    // 파일 타입 검증
    const allowedTypes = [
      'image/jpeg', 
      'image/jpg', 
      'image/png', 
      'image/gif', 
      'image/webp',
      'application/pdf'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: '지원되지 않는 파일 형식입니다. (JPG, JPEG, PNG, GIF, WebP, PDF만 허용)',
        },
        { status: 400 },
      );
    }

    // 고유한 파일명 생성
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = getFileExtension(file.name);
    const fileName = `copyright_evidence/${timestamp}_${randomString}.${extension}`;

    // Vercel Blob에 업로드
    const blob = await put(fileName, file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return NextResponse.json({
      success: true,
      url: blob.url,
    });

  } catch (error) {
    console.error('Error uploading evidence file:', error);
    return NextResponse.json(
      {
        success: false,
        error: '파일 업로드 중 오류가 발생했습니다.',
      },
      { status: 500 },
    );
  }
}; 