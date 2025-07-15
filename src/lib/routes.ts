export const ROUTES = {
  // 메인 페이지
  HOME: '/',
  SHOP: '/shop',

  // 관리자 페이지
  ADMIN: '/admin',
  ADMIN_MEMBER: '/admin/member',
  ADMIN_REVIEW: '/admin/review',
  ADMIN_SALES: '/admin/sales',
  ADMIN_SALES_RANKING: '/admin/sales-ranking',
  ADMIN_ORDERPRINT: '/admin/orderprint',
  ADMIN_ORDERLIST: '/admin/orderlist',
  ADMIN_RETURNLIST: '/admin/returnlist',

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
  SEARCH: '/shop/search',

  // 정보 페이지
  COMPANY: '/shop/company',
  GUIDE: '/shop/guide',
  PROVISION: '/shop/provision',
  PRIVACY: '/shop/privacy',
  BAND: '/shop/band',
} as const;
