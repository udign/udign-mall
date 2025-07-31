export interface Category {
  id: string; // 카테고리 ID (10, 1010, 101010 등)
  name: string; // 카테고리 이름
  parentId?: string; // 상위 카테고리 ID
  order: number; // 출력 순서
  isActive: boolean; // 활성화 여부
  level: number; // 카테고리 단계 (1-5)
  children?: Category[]; // 하위 카테고리들
  createdAt?: string; // 생성일
  updatedAt?: string; // 수정일
}

export interface CategoryFormData {
  name: string;
  parentId?: string;
  order?: number;
  isActive: boolean;
}

export type CategoryCreateRequest = CategoryFormData;

export interface CategoryUpdateRequest extends CategoryFormData {
  id: string;
}

export interface CategoryListResponse {
  categories: Category[];
  total: number;
}

export interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[];
}

// 카테고리 계층 구조를 위한 유틸리티 타입
export interface CategoryHierarchy {
  [key: string]: Category & {
    subCategories?: CategoryHierarchy;
  };
}

// 카테고리 필터링을 위한 타입
export interface CategoryFilter {
  search?: string;
  parentId?: string;
  isActive?: boolean;
  level?: number;
}

// 카테고리 정렬을 위한 타입
export interface CategorySort {
  field: 'name' | 'order' | 'createdAt' | 'updatedAt';
  direction: 'asc' | 'desc';
}

// 카테고리 드래그 앤 드롭을 위한 타입
export interface CategoryReorderRequest {
  categoryId: string;
  newOrder: number;
  parentId?: string;
}

// API 응답 타입들
export interface CategoryApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export type CategoryListApiResponse = CategoryApiResponse<CategoryListResponse>;
export type CategoryDetailApiResponse = CategoryApiResponse<Category>;
export type CategoryCreateApiResponse = CategoryApiResponse<Category>;
export type CategoryUpdateApiResponse = CategoryApiResponse<Category>;
export type CategoryDeleteApiResponse = CategoryApiResponse<{ id: string }>;
