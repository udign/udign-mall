import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { verifyToken } from '@/lib/auth';
import { executeQuery } from '@/lib/database';
import { getFileExtension, getFilenameFromUrl } from '@/lib/utils';

export const POST = async (request: NextRequest) => {
  try {
    // 인증 확인
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const decoded = verifyToken(token) as { mb_id: string; mb_no: number; mb_level: number } | null;
    if (!decoded || !decoded.mb_id) {
      return NextResponse.json({ error: '유효하지 않은 토큰입니다.' }, { status: 401 });
    }

    // FormData에서 데이터 추출
    const formData = await request.formData();
    const category = formData.get('category') as string;
    const artworkName = formData.get('artworkName') as string;
    const description = formData.get('description') as string;
    const targetLikes = parseInt(formData.get('targetLikes') as string) || 100;
    const mainImage = formData.get('mainImage') as File;

    // 추가 이미지들 수집
    const additionalImages: File[] = [];
    for (let i = 0; i < 3; i++) {
      const additionalImage = formData.get(`additionalImage${i}`) as File;
      if (additionalImage && additionalImage.size > 0) {
        additionalImages.push(additionalImage);
      }
    }

    // 유효성 검사
    if (!category || !artworkName || !description || !mainImage) {
      return NextResponse.json(
        {
          success: false,
          message: '필수 항목을 모두 입력해주세요.',
        },
        { status: 400 },
      );
    }

    // 카테고리 검증
    const validCategories = ['10', '20', '30'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        {
          success: false,
          message: '유효하지 않은 카테고리입니다.',
        },
        { status: 400 },
      );
    }

    // 파일 크기 검증 (5MB 제한)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (mainImage.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          message: '대표 이미지의 용량이 5MB를 초과합니다.',
        },
        { status: 400 },
      );
    }

    for (const image of additionalImages) {
      if (image.size > maxSize) {
        return NextResponse.json(
          {
            success: false,
            message: '추가 이미지의 용량이 5MB를 초과합니다.',
          },
          { status: 400 },
        );
      }
    }

    // 파일 확장자 검증
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(mainImage.type)) {
      return NextResponse.json(
        {
          success: false,
          message: '대표 이미지는 JPG, JPEG, PNG 형식만 허용됩니다.',
        },
        { status: 400 },
      );
    }

    for (const image of additionalImages) {
      if (!allowedTypes.includes(image.type)) {
        return NextResponse.json(
          {
            success: false,
            message: '추가 이미지는 JPG, JPEG, PNG 형식만 허용됩니다.',
          },
          { status: 400 },
        );
      }
    }

    // 고유한 상품 ID 생성 (초 단위 타임스탬프 기반, 기존 상품들과 동일한 10자리)
    const it_id = Math.floor(Date.now() / 1000).toString();

    try {
      // 대표 이미지 업로드
      const mainImageBlob = await put(
        `item/${it_id}/main.${getFileExtension(mainImage.name)}`,
        mainImage,
        {
          access: 'public',
          token: process.env.BLOB_READ_WRITE_TOKEN,
        },
      );

      // 추가 이미지들 업로드
      const additionalImageBlobs: string[] = [];
      for (let i = 0; i < additionalImages.length; i++) {
        const image = additionalImages[i];
        const blob = await put(
          `item/${it_id}/sub_${i + 1}.${getFileExtension(image.name)}`,
          image,
          {
            access: 'public',
            token: process.env.BLOB_READ_WRITE_TOKEN,
          },
        );
        additionalImageBlobs.push(getFilenameFromUrl(blob.url));
      }

      // 데이터베이스에 상품 정보 저장
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

      const insertQuery = `
        INSERT INTO g5_shop_item (
          it_id, ca_id, it_name, it_basic, it_explan, it_explan2, it_mobile_explan, 
          it_img1, it_img2, it_img3, it_img4,
          it_price, it_cust_price, it_use, it_soldout, it_stock_qty, it_buy_min_qty, it_buy_max_qty,
          it_sc_type, it_sc_method, it_sc_price, it_sc_minimum, it_sc_qty, it_noti_qty,
          it_type1, it_type2, it_type3, it_type4, it_type5, it_notax, it_nocoupon, it_tel_inq,
          it_time, it_update_time, it_ip,
          it_head_html, it_tail_html, it_mobile_head_html, it_mobile_tail_html,
          it_info_value, it_shop_memo, it_use_avg,
          it_1, it_2, it_3, it_4, it_order
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          0, 0, 0, 0, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?, ?, 0
        )
      `;

      const params = [
        it_id,
        category,
        artworkName,
        description.substring(0, 255), // it_basic은 간단한 설명
        description, // it_explan은 상세 설명
        '', // it_explan2: 추가 설명 (빈 문자열)
        '', // it_mobile_explan: 모바일 설명 (빈 문자열)
        getFilenameFromUrl(mainImageBlob.url), // 대표 이미지
        additionalImageBlobs[0] || '', // 추가 이미지 1
        additionalImageBlobs[1] || '', // 추가 이미지 2
        additionalImageBlobs[2] || '', // 추가 이미지 3
        // 재고 및 구매 설정 (기존 작품들과 동일)
        99999, // it_stock_qty: 재고 수량
        1, // it_buy_min_qty: 최소 구매 수량
        1, // it_buy_max_qty: 최대 구매 수량
        // 배송비 설정 (기존 작품들과 동일)
        0, // it_sc_type: 배송비 타입
        0, // it_sc_method: 배송비 방법
        0, // it_sc_price: 배송비
        0, // it_sc_minimum: 무료배송 최소금액
        0, // it_sc_qty: 배송비 수량
        0, // it_noti_qty: 재고 알림 수량
        // 상품 타입 설정 (기존 작품들과 동일)
        0, // it_type1
        0, // it_type2
        0, // it_type3
        0, // it_type4
        0, // it_type5
        0, // it_notax: 비과세 여부
        0, // it_nocoupon: 쿠폰 사용 불가 여부
        0, // it_tel_inq: 전화문의 여부
        // 시간 및 IP 정보
        now, // it_time
        now, // it_update_time
        '127.0.0.1', // it_ip
        // HTML 설정
        '', // it_head_html: 헤드 HTML (빈 문자열)
        '', // it_tail_html: 테일 HTML (빈 문자열)
        '', // it_mobile_head_html: 모바일 헤드 HTML (빈 문자열)
        '', // it_mobile_tail_html: 모바일 테일 HTML (빈 문자열)
        '', // it_info_value: 상품 정보 값 (빈 문자열)
        '', // it_shop_memo: 쇼핑몰 메모 (빈 문자열)
        0.0, // it_use_avg: 사용 평점 (decimal 기본값)
        // 사용자 정의 필드
        decoded.mb_id, // it_1: 등록자 ID
        decoded.mb_id, // it_2: 작가명 (회원 ID로 설정)
        description, // it_3: 작품설명
        targetLikes, // it_4: 목표 좋아요 수
      ];

      await executeQuery(insertQuery, params);

      return NextResponse.json({
        success: true,
        message: '작품이 성공적으로 업로드되었습니다.',
        data: {
          it_id,
          artworkName,
          category,
        },
      });
    } catch (uploadError) {
      console.error('File upload error:', uploadError);
      return NextResponse.json(
        {
          success: false,
          message: '파일 업로드 중 오류가 발생했습니다.',
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('Artwork upload error:', error);
    return NextResponse.json(
      {
        success: false,
        message: '서버 오류가 발생했습니다.',
      },
      { status: 500 },
    );
  }
};
