export const STATUS_GROUPS = {
  all: '전체',
  collection: '❤️ 디자인',
  review: '제작 검토',
  payment: '구매 진행',
  paymentCompleted: '주문 확정',
  making: '상품 제작',
  shipping: '배송 진행',
  completed: '수령 완료',
  cancelled: '취소/반품/품절',
} as const;

export const STATUS_MAPPING = {
  주문: '결제대기',
  입금: '결제완료',
  준비: '상품 제작',
  배송: '배송 진행',
  완료: '수령 완료',
  구매확정: '구매확정',
  취소: '주문취소',
  반품: '반품',
  품절: '품절',
} as const;

// 페이지네이션 관련 설정
export const PAGINATION_CONFIG = {
  ITEMS_PER_PAGE: 2, // 페이지당 상품 수
  VISIBLE_PAGE_COUNT: 5, // 페이지네이션에서 보여줄 페이지 개수
  DEFAULT_CATEGORY_ID: '10', // 기본 카테고리 ID (패션)
  MY_UDIGN_PAGE_SIZE: 10, // My UDIGN 페이지의 무한 스크롤 페이지 크기
} as const;

// 카테고리 ID 상수
export const CATEGORY_IDS = {
  FASHION: '10', // 패션 카테고리
  SHOES: '20', // 신발 카테고리
  OTHERS: '30', // 기타 카테고리
} as const;

// 회원 권한 레벨 상수
export const MEMBER_LEVELS = {
  SUPER_ADMIN: 100, // 슈퍼 관리자 (모든 관리자 관리 가능)
  ADMIN: 10, // 관리자 (관리자 페이지 접근 가능)
  EXCELLENT: 5, // 우수회원
  REGULAR: 2, // 정회원 (신규 가입 기본값)
  BASIC: 1, // 일반회원
  GUEST: 0, // 게스트
} as const;

// 회원 권한 분류 옵션
export const LEVEL_OPTIONS = [
  {
    minLevel: MEMBER_LEVELS.ADMIN,
    label: '관리자',
    color: 'bg-red-100 text-red-800',
  },
  {
    minLevel: MEMBER_LEVELS.EXCELLENT,
    label: '우수회원',
    color: 'bg-purple-100 text-purple-800',
  },
  {
    minLevel: MEMBER_LEVELS.REGULAR,
    label: '정회원',
    color: 'bg-blue-100 text-blue-800',
  },
  {
    minLevel: MEMBER_LEVELS.BASIC,
    label: '일반회원',
    color: 'bg-gray-100 text-gray-800',
  },
] as const;

// 권한 체크 유틸리티 함수
export const PERMISSION_CHECKS = {
  isAdmin: (level: number) => level >= MEMBER_LEVELS.ADMIN,
  isSuperAdmin: (level: number) => level >= MEMBER_LEVELS.SUPER_ADMIN,
  isExcellent: (level: number) => level >= MEMBER_LEVELS.EXCELLENT,
  isRegular: (level: number) => level >= MEMBER_LEVELS.REGULAR,
  canManageUser: (currentLevel: number, targetLevel: number) =>
    currentLevel >= MEMBER_LEVELS.SUPER_ADMIN || currentLevel > targetLevel,
} as const;
