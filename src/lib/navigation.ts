import { ROUTES } from '@/lib/routes';

export interface ThirdCategory {
  id: string;
  label: string;
  href: string;
}

export interface SubCategory {
  id: string;
  label: string;
  href: string;
  thirdCategories?: ThirdCategory[];
}

export interface NavMenuItem {
  href: string;
  label: string;
  requiresAuth?: boolean;
  subCategories?: SubCategory[];
}

export const NAV_MENU_ITEMS: NavMenuItem[] = [
  {
    href: ROUTES.FASHION,
    label: 'fashion',
    subCategories: [
      {
        id: '1010',
        label: 'men',
        href: `${ROUTES.FASHION}?subcategory=1010`,
        thirdCategories: [
          {
            id: '101010',
            label: 'top',
            href: `${ROUTES.FASHION}?subcategory=1010&thirdcategory=101010`,
          },
          {
            id: '101020',
            label: 'bottom',
            href: `${ROUTES.FASHION}?subcategory=1010&thirdcategory=101020`,
          },
          {
            id: '101030',
            label: 'outer',
            href: `${ROUTES.FASHION}?subcategory=1010&thirdcategory=101030`,
          },
          {
            id: '101040',
            label: 'product',
            href: `${ROUTES.FASHION}?subcategory=1010&thirdcategory=101040`,
          },
          {
            id: '101050',
            label: 'space',
            href: `${ROUTES.FASHION}?subcategory=1010&thirdcategory=101050`,
          },
        ],
      },
      {
        id: '1020',
        label: 'women',
        href: `${ROUTES.FASHION}?subcategory=1020`,
        thirdCategories: [
          {
            id: '102010',
            label: 'top',
            href: `${ROUTES.FASHION}?subcategory=1020&thirdcategory=102010`,
          },
          {
            id: '102020',
            label: 'bottom',
            href: `${ROUTES.FASHION}?subcategory=1020&thirdcategory=102020`,
          },
          {
            id: '102030',
            label: 'outer',
            href: `${ROUTES.FASHION}?subcategory=1020&thirdcategory=102030`,
          },
          {
            id: '102040',
            label: 'product',
            href: `${ROUTES.FASHION}?subcategory=1020&thirdcategory=102040`,
          },
          {
            id: '102050',
            label: 'space',
            href: `${ROUTES.FASHION}?subcategory=1020&thirdcategory=102050`,
          },
        ],
      },
    ],
  },
  {
    href: ROUTES.SHOES,
    label: 'shoes',
    subCategories: [
      {
        id: '2010',
        label: 'men',
        href: `${ROUTES.SHOES}?subcategory=2010`,
        thirdCategories: [
          {
            id: '201010',
            label: '운동화',
            href: `${ROUTES.SHOES}?subcategory=2010&thirdcategory=201010`,
          },
          {
            id: '201020',
            label: '구두/스니커즈',
            href: `${ROUTES.SHOES}?subcategory=2010&thirdcategory=201020`,
          },
          {
            id: '201030',
            label: '워커',
            href: `${ROUTES.SHOES}?subcategory=2010&thirdcategory=201030`,
          },
          {
            id: '201040',
            label: '샌들/슬리퍼',
            href: `${ROUTES.SHOES}?subcategory=2010&thirdcategory=201040`,
          },
          {
            id: '201050',
            label: '레인부츠',
            href: `${ROUTES.SHOES}?subcategory=2010&thirdcategory=201050`,
          },
        ],
      },
      {
        id: '2020',
        label: 'women',
        href: `${ROUTES.SHOES}?subcategory=2020`,
        thirdCategories: [
          {
            id: '202010',
            label: '운동화',
            href: `${ROUTES.SHOES}?subcategory=2020&thirdcategory=202010`,
          },
          {
            id: '202020',
            label: '구두/스니커즈',
            href: `${ROUTES.SHOES}?subcategory=2020&thirdcategory=202020`,
          },
          {
            id: '202030',
            label: '샌들/슬리퍼',
            href: `${ROUTES.SHOES}?subcategory=2020&thirdcategory=202030`,
          },
          {
            id: '202040',
            label: '부츠',
            href: `${ROUTES.SHOES}?subcategory=2020&thirdcategory=202040`,
          },
          {
            id: '202050',
            label: '레인부츠',
            href: `${ROUTES.SHOES}?subcategory=2020&thirdcategory=202050`,
          },
        ],
      },
    ],
  },
  {
    href: ROUTES.OTHERS,
    label: 'others',
    subCategories: [
      {
        id: '3010',
        label: 'men',
        href: `${ROUTES.OTHERS}?subcategory=3010`,
        thirdCategories: [
          {
            id: '301010',
            label: '상의',
            href: `${ROUTES.OTHERS}?subcategory=3010&thirdcategory=301010`,
          },
          {
            id: '301020',
            label: '하의',
            href: `${ROUTES.OTHERS}?subcategory=3010&thirdcategory=301020`,
          },
          {
            id: '301030',
            label: 'graphic',
            href: `${ROUTES.OTHERS}?subcategory=3010&thirdcategory=301030`,
          },
          {
            id: '301040',
            label: 'product',
            href: `${ROUTES.OTHERS}?subcategory=3010&thirdcategory=301040`,
          },
          {
            id: '301050',
            label: 'space',
            href: `${ROUTES.OTHERS}?subcategory=3010&thirdcategory=301050`,
          },
        ],
      },
      {
        id: '3020',
        label: 'women',
        href: `${ROUTES.OTHERS}?subcategory=3020`,
        thirdCategories: [
          {
            id: '302010',
            label: '상의',
            href: `${ROUTES.OTHERS}?subcategory=3020&thirdcategory=302010`,
          },
          {
            id: '302020',
            label: '하의',
            href: `${ROUTES.OTHERS}?subcategory=3020&thirdcategory=302020`,
          },
          {
            id: '302030',
            label: 'graphic',
            href: `${ROUTES.OTHERS}?subcategory=3020&thirdcategory=302030`,
          },
          {
            id: '302040',
            label: 'product',
            href: `${ROUTES.OTHERS}?subcategory=3020&thirdcategory=302040`,
          },
          {
            id: '302050',
            label: 'space',
            href: `${ROUTES.OTHERS}?subcategory=3020&thirdcategory=302050`,
          },
        ],
      },
    ],
  },
  { href: ROUTES.UPLOAD, label: '디자인 업로드', requiresAuth: true },
];
