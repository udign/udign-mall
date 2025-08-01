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

// 카테고리 ID로 기본 라우트 경로 생성
const getCategoryRoute = (categoryId: string): string => {
  if (categoryId.startsWith('10')) return ROUTES.FASHION;
  if (categoryId.startsWith('20')) return ROUTES.SHOES;
  if (categoryId.startsWith('30')) return ROUTES.OTHERS;
  return ROUTES.SHOP; // 기본값
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

        // 디버깅: 각 3차 카테고리별 4차 카테고리 확인
        console.log(`🔍 3차 카테고리: ${thirdLevel.name} (ID: ${thirdLevel.id})`);
        console.log(`  - 전체 카테고리 개수: ${categories.length}`);
        console.log(
          `  - 4차 카테고리 후보:`,
          categories.filter((cat) => cat.level === 4),
        );
        console.log(`  - parentId가 ${thirdLevel.id}인 4차 카테고리:`, fourthLevelCategories);
        console.log(`  - 4차 카테고리 개수: ${fourthLevelCategories.length}`);

        const fourthCategories: FourthCategory[] = fourthLevelCategories.map((fourthLevel) => ({
          id: fourthLevel.id,
          label: fourthLevel.name,
          href: `${getCategoryRoute(firstLevel.id)}?subcategory=${secondLevel.id}&thirdcategory=${thirdLevel.id}&fourthcategory=${fourthLevel.id}`,
        }));

        const result = {
          id: thirdLevel.id,
          label: thirdLevel.name,
          href: `${getCategoryRoute(firstLevel.id)}?subcategory=${secondLevel.id}&thirdcategory=${thirdLevel.id}`,
          fourthCategories: fourthCategories.length > 0 ? fourthCategories : undefined,
        };

        console.log(`  - 최종 결과:`, result);
        console.log(`  - fourthCategories 존재 여부: ${!!result.fourthCategories}`);

        return result;
      });

      return {
        id: secondLevel.id,
        label: secondLevel.name,
        href: `${getCategoryRoute(firstLevel.id)}?subcategory=${secondLevel.id}`,
        thirdCategories: thirdCategories.length > 0 ? thirdCategories : undefined,
      };
    });

    return {
      href: getCategoryRoute(firstLevel.id),
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
