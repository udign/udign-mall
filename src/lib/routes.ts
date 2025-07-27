export const ROUTES = {
  // 메인 페이지
  HOME: '/',
  SHOP: '/shop',

  // 관리자 페이지
  ADMIN: '/admin',
  ADMIN_MEMBER: '/admin/member',
  ADMIN_VENDOR: '/admin/vendor',
  ADMIN_REVIEW: '/admin/review',
  ADMIN_SALES: '/admin/sales',
  ADMIN_SALES_RANKING: '/admin/sales-ranking',
  ADMIN_ORDERPRINT: '/admin/orderprint',
  ADMIN_ORDERLIST: '/admin/orderlist',
  ADMIN_RETURNLIST: '/admin/returnlist',
  ADMIN_POPUP: '/admin/popup',
  ADMIN_POPUP_CREATE: '/admin/popup/create',
  ADMIN_POPUP_EDIT: '/admin/popup/edit',
  ADMIN_SIZE_GUIDE: '/admin/size-guide',
  ADMIN_MAIL_TEST: '/admin/mail-test',
  ADMIN_SMS_CONFIG: '/admin/sms/config',
  ADMIN_SMS_TEST: '/admin/sms/test',

  // 인증 관련
  LOGIN: '/shop/login',
  REGISTER: '/shop/register',
  TERMS: '/shop/terms',
  FORGOT_PASSWORD: '/shop/forgot-password',
  RESET_PASSWORD: '/shop/reset-password',

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

  // 회원정보 관련
  PROFILE_CONFIRM: '/shop/profile/confirm',
  PROFILE_EDIT: '/shop/profile/edit',

  // 정보 페이지
  COMPANY: '/shop/company',
  GUIDE: '/shop/guide',
  PROVISION: '/shop/provision',
  PRIVACY: '/shop/privacy',
  VENDOR: '/shop/vendor',
  COPYRIGHT_REPORT: '/shop/copyright-report',
} as const;
