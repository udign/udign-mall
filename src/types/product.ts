export interface Category {
  ca_id: string;
  ca_name: string;
  ca_order: number;
  ca_use: string;
  ca_img_width: number;
  ca_img_height: number;
  ca_list_mod: number;
  ca_list_row: number;
  ca_skin: string;
  ca_skin_dir: string;
  ca_head_html: string;
  ca_tail_html: string;
  ca_include_head: string;
  ca_include_tail: string;
}

export interface Product {
  it_id: string;
  it_name: string;
  it_basic: string;
  it_cust_price: number;
  it_price: number;
  it_img1: string | null;
  it_img2: string | null;
  it_img3: string | null;
  it_use_avg: number;
  it_use_cnt: number;
  it_hit: number;
  it_time: string;
  it_update_time: string;
  ca_id: string;
  creator_id: string;
  creator_name: string;
  description: string;
  likes_count: string;
  is_liked?: boolean; // 현재 사용자가 좋아요했는지 여부 (선택적)
  current_likes?: number; // 현재 좋아요 수 (선택적)
}

export interface ProductDetail extends Product {
  it_info: string; // 상품 상세 정보
  it_mobile_info: string; // 모바일 상품 정보
  it_head_html: string; // 상단 HTML
  it_tail_html: string; // 하단 HTML
  it_4: number; // 목표 인원
  it_8: number; // 심의 기간
  it_9: string; // 수동 심의 여부 (Y/N)
  it_10: string; // 심의 완료 여부 (Y/N)
  ca_name: string; // 카테고리 이름
  is_liked: boolean; // 현재 사용자가 좋아요했는지 여부
  current_likes: number; // 현재 좋아요 수
  goal_attainment: boolean; // 목표 달성 여부
  is_under_review: boolean; // 심의중 여부
  is_review_completed: boolean; // 심의 완료 여부
}

export interface ProductListResponse {
  success: boolean;
  category: Category;
  items: Product[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  categoryCounts: Record<string, { name: string; count: number }>;
}

export interface ProductDetailResponse {
  success: boolean;
  product: ProductDetail;
  prev_product?: {
    it_id: string;
    it_name: string;
  };
  next_product?: {
    it_id: string;
    it_name: string;
  };
}

export interface LikeResponse {
  is_liked: boolean;
  current_likes: number;
  order_number?: number; // 좋아요 순번 (새로 좋아요할 때만 포함)
  product_name?: string; // 상품명 (새로 좋아요할 때만 포함)
}
