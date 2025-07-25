import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { RowDataPacket } from 'mysql2';
import { getImageUrl } from '@/lib/utils';

interface JwtPayload {
  mb_id: string;
  [key: string]: unknown;
}

interface ProductRow extends RowDataPacket {
  it_id: string;
  it_name: string;
  it_basic: string;
  it_explan: string;
  it_img1: string;
  it_img2: string;
  it_img3: string;
  it_cust_price: number;
  it_price: number;
  it_2: string; // 작가명
  it_3: string; // 작품설명
  it_4: string; // 목표 인원
  it_8: string; // 심의 기간
  it_9: string; // 수동 심의 여부
  it_10: string; // 심의 완료 여부
  it_order: number;
  ca_id: string;
  ca_name: string;
  current_likes: number;
  is_liked: number;
}

interface TimeRow extends RowDataPacket {
  first_time: string;
}

interface NavigationRow extends RowDataPacket {
  it_id: string;
  it_name: string;
}

export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const { id: productId } = await params;

    if (!productId) {
      return NextResponse.json({ success: false, error: '상품 ID가 필요합니다.' }, { status: 400 });
    }

    // 현재 로그인한 사용자 정보 가져오기
    let currentUserId: string | null = null;
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get('auth-token')?.value;

      if (token && process.env.JWT_SECRET) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
        currentUserId = decoded.mb_id;
      }
    } catch {
      // 토큰이 유효하지 않은 경우 무시
    }

    // 상품 상세 정보 조회
    const productQuery = `
      SELECT 
        i.*,
        c.ca_name,
        COALESCE(like_count.cnt, 0) as current_likes,
        CASE WHEN user_like.mb_id IS NOT NULL THEN 1 ELSE 0 END as is_liked
      FROM g5_shop_item i
      LEFT JOIN g5_shop_category c ON i.ca_id = c.ca_id
      LEFT JOIN (
        SELECT it_id, COUNT(*) as cnt 
        FROM g5_shop_interrest 
        WHERE it_id = ?
        GROUP BY it_id
      ) like_count ON i.it_id = like_count.it_id
      LEFT JOIN g5_shop_interrest user_like ON i.it_id = user_like.it_id AND user_like.mb_id = ?
      WHERE i.it_id = ? AND i.it_use = '1'
    `;

    const productResults = (await executeQuery(productQuery, [
      productId,
      currentUserId || '',
      productId,
    ])) as ProductRow[];

    const product = productResults[0] || null;

    if (!product) {
      return NextResponse.json(
        { success: false, error: '상품을 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    // 목표 달성 여부 확인 (it_4가 목표 인원)
    const targetCount = parseInt(product.it_4) || 0;
    const currentLikes = product.current_likes || 0;
    const goalAttainment = currentLikes >= targetCount;

    // 심의 상태 확인
    const isReviewCompleted = product.it_10 === 'N';
    const manualReview = product.it_9 === 'Y';
    const reviewDays = parseInt(product.it_8) || 0;

    let isUnderReview = false;

    // 1. 관리자가 수동으로 심의중으로 설정한 경우 (최우선 처리)
    if (product.it_10 === 'Y') {
      isUnderReview = true;
    }
    // 2. 심의 완료가 아닌 경우의 다른 조건들
    else if (!isReviewCompleted) {
      if (goalAttainment && !manualReview) {
        // 자동 심의: 목표 달성시 심의중
        isUnderReview = true;
      } else if (manualReview && reviewDays > 0) {
        // 수동 심의: 기간 확인 필요 (첫 좋아요 시간 기준)
        const firstInterestQuery = `
          SELECT MIN(ir_time) as first_time 
          FROM g5_shop_interrest 
          WHERE it_id = ?
        `;
        const firstInterestResults = (await executeQuery(firstInterestQuery, [
          productId,
        ])) as TimeRow[];
        const firstInterest = firstInterestResults[0] || null;

        if (firstInterest?.first_time) {
          const daysPassed = Math.floor(
            (Date.now() - new Date(firstInterest.first_time).getTime()) / (1000 * 60 * 60 * 24),
          );
          if (daysPassed >= reviewDays) {
            isUnderReview = true;
          }
        }
      }
    }

    // 같은 카테고리에서 이전/다음 상품 조회
    const getNavigationProducts = async () => {
      // 이전/다음 상품 조회 (같은 카테고리 내에서만)
      const prevProductQuery = `
        SELECT 
          i.it_id, 
          i.it_name
        FROM g5_shop_item i
        WHERE i.it_time > ? AND i.it_use = '1' AND i.ca_id = ?
        ORDER BY i.it_time ASC 
        LIMIT 1
      `;

      const nextProductQuery = `
        SELECT 
          i.it_id, 
          i.it_name
        FROM g5_shop_item i
        WHERE i.it_time < ? AND i.it_use = '1' AND i.ca_id = ?
        ORDER BY i.it_time DESC 
        LIMIT 1
      `;

      const prevResults = (await executeQuery(prevProductQuery, [
        product.it_time,
        product.ca_id,
      ])) as NavigationRow[];

      const nextResults = (await executeQuery(nextProductQuery, [
        product.it_time,
        product.ca_id,
      ])) as NavigationRow[];

      return {
        prevProduct: prevResults[0]
          ? { it_id: prevResults[0].it_id, it_name: prevResults[0].it_name }
          : null,
        nextProduct: nextResults[0]
          ? { it_id: nextResults[0].it_id, it_name: nextResults[0].it_name }
          : null,
      };
    };

    const { prevProduct, nextProduct } = await getNavigationProducts();

    // 모든 작품에 접근 가능하도록 설정
    const hasAccess = true;

    // 구매 가능 여부
    const canPurchase = isReviewCompleted && currentUserId;

    // 상태 메시지 설정
    let statusMessage = '';
    if (isReviewCompleted) {
      statusMessage = '구매 가능한 상품입니다.';
    } else if (isUnderReview) {
      statusMessage = '현재 심의 진행 중입니다.';
    } else {
      statusMessage = '좋아요 모집 중입니다.';
    }

    // 상품 옵션 조회
    const optionRows = (await executeQuery(
      `SELECT io_id, io_price, io_stock_qty, io_use
       FROM g5_shop_item_option 
       WHERE it_id = ? AND io_use = 1 
       ORDER BY io_type ASC, io_no ASC`,
      [productId],
    )) as {
      io_id: string;
      io_price: number;
      io_stock_qty: number;
      io_use: number;
    }[];

    const options = optionRows.map((option) => {
      // 옵션 ID를 사람이 읽기 쉬운 형태로 변환 (chr(30) = ASCII 30)
      const optionValues = option.io_id.split(String.fromCharCode(30));
      const optionDisplay = optionValues.filter((val) => val.trim()).join(' > ');

      return {
        io_id: option.io_id,
        io_price: option.io_price,
        io_stock_qty: option.io_stock_qty,
        io_use: option.io_use,
        option_display: optionDisplay || '기본 옵션',
      };
    });

    // 조회수 증가
    await executeQuery('UPDATE g5_shop_item SET it_hit = it_hit + 1 WHERE it_id = ?', [productId]);

    const response = {
      success: true,
      product: {
        it_id: product.it_id,
        it_name: product.it_name || '',
        it_basic: product.it_basic || '',
        it_cust_price:
          typeof product.it_cust_price === 'string'
            ? parseInt(product.it_cust_price)
            : product.it_cust_price || 0,
        it_price:
          typeof product.it_price === 'string' ? parseInt(product.it_price) : product.it_price || 0,
        it_img1: getImageUrl(product.it_img1),
        it_img2: getImageUrl(product.it_img2),
        it_img3: getImageUrl(product.it_img3),
        it_info: product.it_explan || '', // it_explan을 it_info로 매핑
        ca_name: product.ca_name || '',
        creator_name: product.it_2 || '', // it_2가 작가명
        description: product.it_3 || '', // it_3이 작품설명
        current_likes: currentLikes,
        is_liked: Boolean(product.is_liked),
        goal_attainment: goalAttainment,
        is_under_review: isUnderReview,
        is_review_completed: isReviewCompleted,
        it_4: targetCount, // 목표 인원
        it_8: parseInt(product.it_8) || 0, // 심의 기간
        it_9: product.it_9, // 수동 심의 여부
        it_10: product.it_10, // 심의 완료 여부
        has_access: hasAccess, // 접근 권한
        can_purchase: canPurchase, // 구매 가능 여부
        status_message: statusMessage, // 상태 메시지
        options: options, // 상품 옵션 추가
      },
      prev_product: prevProduct || undefined,
      next_product: nextProduct || undefined,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('상품 상세 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
};
