import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { del } from '@vercel/blob';

// HTML 내용에서 이미지 URL을 추출하는 함수
const extractImageUrls = (htmlContent: string): string[] => {
  if (!htmlContent) return [];

  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  const urls: string[] = [];
  let match;

  while ((match = imgRegex.exec(htmlContent)) !== null) {
    const url = match[1];
    // Vercel Storage URL만 추출 (blob.vercel-storage.com 포함)
    if (url.includes('blob.vercel-storage.com') && url.includes('/popup/')) {
      urls.push(url);
    }
  }

  return urls;
};

// Vercel Storage에서 이미지 삭제
const deleteImageFromStorage = async (imageUrl: string): Promise<void> => {
  try {
    await del(imageUrl, {
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
  } catch (error) {
    console.error(`이미지 삭제 실패: ${imageUrl}`, error);
  }
};

export const DELETE = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const popupId = parseInt((await params).id, 10);

    if (isNaN(popupId)) {
      return NextResponse.json({ error: '유효하지 않은 팝업 ID입니다.' }, { status: 400 });
    }

    // 팝업 존재 여부 확인
    const existingPopup = await executeQuery('SELECT nw_id FROM g5_new_win WHERE nw_id = ?', [
      popupId,
    ]);

    if (!Array.isArray(existingPopup) || existingPopup.length === 0) {
      return NextResponse.json({ error: '팝업을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 팝업 삭제
    await executeQuery('DELETE FROM g5_new_win WHERE nw_id = ?', [popupId]);

    return NextResponse.json({ success: true, message: '팝업이 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error('팝업 삭제 오류:', error);
    return NextResponse.json({ error: '팝업 삭제 중 오류가 발생했습니다.' }, { status: 500 });
  }
};

// 개별 팝업 조회 (편집용)
export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const popupId = parseInt((await params).id, 10);

    if (isNaN(popupId)) {
      return NextResponse.json({ error: '유효하지 않은 팝업 ID입니다.' }, { status: 400 });
    }

    const result = await executeQuery('SELECT * FROM g5_new_win WHERE nw_id = ?', [popupId]);

    if (!Array.isArray(result) || result.length === 0) {
      return NextResponse.json({ error: '팝업을 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('팝업 조회 오류:', error);
    return NextResponse.json({ error: '팝업 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
};

// 개별 팝업 수정
export const PUT = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const popupId = parseInt((await params).id, 10);

    if (isNaN(popupId)) {
      return NextResponse.json({ error: '유효하지 않은 팝업 ID입니다.' }, { status: 400 });
    }

    const data = await request.json();

    // 기존 팝업 내용 조회 (이미지 비교용)
    const existingPopupResult = await executeQuery(
      'SELECT nw_content FROM g5_new_win WHERE nw_id = ?',
      [popupId],
    );

    if (!Array.isArray(existingPopupResult) || existingPopupResult.length === 0) {
      return NextResponse.json({ error: '팝업을 찾을 수 없습니다.' }, { status: 404 });
    }

    const existingContent = (existingPopupResult[0] as { nw_content: string }).nw_content || '';
    const newContent = data.nw_content || '';

    // 기존 이미지 URL과 새로운 이미지 URL 추출
    const existingImageUrls = extractImageUrls(existingContent);
    const newImageUrls = extractImageUrls(newContent);

    // 삭제된 이미지 URL 찾기
    const deletedImageUrls = existingImageUrls.filter((url) => !newImageUrls.includes(url));

    // 팝업 정보 업데이트
    await executeQuery(
      `UPDATE g5_new_win SET 
        nw_division = ?, 
        nw_device = ?, 
        nw_begin_time = ?, 
        nw_end_time = ?, 
        nw_disable_hours = ?, 
        nw_left = ?, 
        nw_top = ?, 
        nw_height = ?, 
        nw_width = ?, 
        nw_subject = ?, 
        nw_content = ?, 
        nw_content_html = ?
       WHERE nw_id = ?`,
      [
        data.nw_division,
        data.nw_device,
        data.nw_begin_time,
        data.nw_end_time,
        data.nw_disable_hours,
        data.nw_left,
        data.nw_top,
        data.nw_height,
        data.nw_width,
        data.nw_subject,
        data.nw_content,
        data.nw_content_html,
        popupId,
      ],
    );

    // 삭제된 이미지들을 Vercel Storage에서 제거
    if (deletedImageUrls.length > 0) {
      // 이미지 삭제를 병렬로 처리
      await Promise.allSettled(deletedImageUrls.map((url) => deleteImageFromStorage(url)));
    }

    return NextResponse.json({
      success: true,
      message: '팝업이 성공적으로 수정되었습니다.',
      deletedImages: deletedImageUrls.length,
    });
  } catch (error) {
    console.error('팝업 수정 오류:', error);
    return NextResponse.json({ error: '팝업 수정 중 오류가 발생했습니다.' }, { status: 500 });
  }
};
