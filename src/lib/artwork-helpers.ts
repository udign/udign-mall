/**
 * 작품 관련 헬퍼 함수들
 */

// 디자인 좋아요 이후 단계 상태 목록 (블러 처리 대상)
const POST_DESIGN_LIKE_STATUSES = [
  '제작 검토',
  '심의중',
  '구매 진행',
  '결제대기',
  '결제완료',
  '상품 제작',
  '배송 진행',
  '배송중',
  '수령 완료',
  '완료',
  '구매확정',
];

/**
 * 작품이 블러 처리되어야 하는지 판단하는 함수
 * @param product - 작품 정보
 * @param isUserLiked - 사용자가 좋아요를 눌렀는지 여부
 * @returns 블러 처리 여부
 */
export const shouldBlurProduct = (
  product: {
    current_likes: number;
    it_4?: number;
    target_likes?: number;
    _status_text?: string;
  },
  isUserLiked: boolean,
): boolean => {
  // 이미 좋아요를 누른 사용자는 블러 처리 안함
  if (isUserLiked) {
    return false;
  }

  const targetLikes = product.it_4 || product.target_likes || 100;
  const currentLikes = product.current_likes || 0;
  const statusText = product._status_text || '';

  // 조건 1: 목표 좋아요 수 달성
  const isGoalAchieved = currentLikes >= targetLikes;

  // 조건 2: 디자인 좋아요 이후 단계
  const isPostDesignLikeStage = POST_DESIGN_LIKE_STATUSES.includes(statusText);

  // 둘 중 하나라도 해당하면 블러 처리
  return isGoalAchieved || isPostDesignLikeStage;
};

/**
 * 작품의 접근 가능 여부를 판단하는 함수 (상세 페이지용)
 * @param product - 작품 정보
 * @param isUserLiked - 사용자가 좋아요를 눌렀는지 여부
 * @returns 접근 가능 여부
 */
export const canAccessProduct = (
  product: {
    current_likes: number;
    it_4?: number;
    target_likes?: number;
    _status_text?: string;
  },
  isUserLiked: boolean,
): boolean => {
  // 블러 처리되는 작품은 접근 불가 (좋아요 안누른 경우)
  return !shouldBlurProduct(product, isUserLiked);
};

/**
 * 작품 상태가 구매 가능한 단계인지 판단하는 함수
 * @param statusText - 작품 상태 텍스트
 * @returns 구매 가능 여부
 */
export const isPurchasableStatus = (statusText: string): boolean => {
  return statusText === '구매 진행';
};

/**
 * 작품 상태가 좋아요 모집 단계인지 판단하는 함수
 * @param statusText - 작품 상태 텍스트
 * @returns 좋아요 모집 여부
 */
export const isCollectionStatus = (statusText: string): boolean => {
  return statusText === '컬렉션' || statusText === '디자인 좋아요' || statusText === '❤️ 디자인';
};

/**
 * ProductDetail에서 현재 상태를 판단하는 함수
 * @param product - ProductDetail 객체
 * @returns 현재 상태 텍스트
 */
export const getProductStatus = (product: {
  current_likes: number;
  it_4: number;
  is_under_review: boolean;
  is_review_completed: boolean;
  can_purchase: boolean;
}): string => {
  // 목표 달성 여부
  const isGoalAchieved = product.current_likes >= product.it_4;

  // 심의 완료 (구매 가능)
  if (product.can_purchase || product.is_review_completed) {
    return '구매 진행';
  }

  // 심의 중
  if (product.is_under_review) {
    return '심의중';
  }

  // 목표 달성했지만 아직 심의 시작 안함
  if (isGoalAchieved) {
    return '제작 검토';
  }

  // 목표 미달성
  return '컬렉션';
};
