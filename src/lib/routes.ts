export const ROUTES = {
  // 메인 페이지
  HOME: '/',
  SHOP: '/shop',

  // 관리자 페이지
  ADMIN: '/admin',
  ADMIN_REVIEW: '/admin/review',

  // 인증 관련
  LOGIN: '/shop/login',
  REGISTER: '/shop/register',
  TERMS: '/shop/terms',

  // 카테고리 페이지
  FASHION: '/shop/fashion',
  SHOES: '/shop/shoes',
  OTHERS: '/shop/others',

  // 상품 상세 페이지
  PRODUCT: '/shop/product',

  // 기능 페이지
  UPLOAD: '/shop/upload',
  MY_UDIGN: '/shop/my-udign',

  // 정보 페이지
  ABOUT: '/shop/about',
  GUIDE: '/shop/guide',
  PRIVACY: '/shop/privacy',
  BAND: '/shop/band',
} as const;
