import { ROUTES } from '@/lib/routes';
import { Category } from '@/types/category';

export interface FourthCategory {
  id: string;
  label: string;
  href: string;
}

export interface ThirdCategory {
  id: string;
  label: string;
  href: string;
  fourthCategories?: FourthCategory[];
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

// DB에서 카테고리 목록 가져오기
export const fetchCategoriesForNavigation = async (): Promise<Category[]> => {
  try {
    const response = await fetch('/api/admin/categories'); // isActive 필터 제거하여 모든 카테고리 가져오기
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || '카테고리 목록을 불러오는데 실패했습니다.');
    }

    return data.data?.categories || [];
  } catch (error) {
    console.error('네비게이션 카테고리 로드 실패:', error);
    return [];
  }
};

// 카테고리 ID로 기본 라우트 경로 생성 (통합 카테고리 페이지 사용)
const getCategoryRoute = (): string => {
  return ROUTES.CATEGORIES; // 모든 카테고리가 동일한 페이지 사용
};

// DB 카테고리를 네비게이션 메뉴 형태로 변환
export const convertCategoriesToNavMenuItems = (categories: Category[]): NavMenuItem[] => {
  // 1단계 카테고리들만 필터링 (메인 카테고리)
  const firstLevelCategories = categories.filter((cat) => cat.level === 1 && cat.isActive);

  return firstLevelCategories.map((firstLevel) => {
    // 2단계 카테고리들 찾기 (서브 카테고리)
    const secondLevelCategories = categories.filter(
      (cat) => cat.level === 2 && cat.parentId === firstLevel.id && cat.isActive,
    );

    const baseRoute = getCategoryRoute();

    const subCategories: SubCategory[] = secondLevelCategories.map((secondLevel) => {
      // 3단계 카테고리들 찾기 (써드 카테고리)
      const thirdLevelCategories = categories.filter(
        (cat) => cat.level === 3 && cat.parentId === secondLevel.id && cat.isActive,
      );

      const thirdCategories: ThirdCategory[] = thirdLevelCategories.map((thirdLevel) => {
        // 4단계 카테고리들 찾기 (포스 카테고리) - isActive 상태 무관하게 가져오기
        const fourthLevelCategories = categories.filter(
          (cat) => cat.level === 4 && cat.parentId === thirdLevel.id,
        );

        const fourthCategories: FourthCategory[] = fourthLevelCategories.map((fourthLevel) => ({
          id: fourthLevel.id,
          label: fourthLevel.name,
          href: `${baseRoute}?ca_id=${firstLevel.id}&ca_id2=${secondLevel.id}&ca_id3=${thirdLevel.id}&ca_id4=${fourthLevel.id}`,
        }));

        return {
          id: thirdLevel.id,
          label: thirdLevel.name,
          href: `${baseRoute}?ca_id=${firstLevel.id}&ca_id2=${secondLevel.id}&ca_id3=${thirdLevel.id}`,
          fourthCategories: fourthCategories.length > 0 ? fourthCategories : undefined,
        };
      });

      return {
        id: secondLevel.id,
        label: secondLevel.name,
        href: `${baseRoute}?ca_id=${firstLevel.id}&ca_id2=${secondLevel.id}`,
        thirdCategories: thirdCategories.length > 0 ? thirdCategories : undefined,
      };
    });

    return {
      href: `${getCategoryRoute()}?ca_id=${firstLevel.id}`,
      label: firstLevel.name,
      subCategories: subCategories.length > 0 ? subCategories : undefined,
    };
  });
};

// 고정 메뉴 항목들 (카테고리가 아닌 기능적 메뉴들)
export const STATIC_NAV_MENU_ITEMS: NavMenuItem[] = [
  { href: ROUTES.UPLOAD, label: '디자인 업로드', requiresAuth: true },
  { href: ROUTES.GUIDE, label: '이용안내' },
];
