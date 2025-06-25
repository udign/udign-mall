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
}
