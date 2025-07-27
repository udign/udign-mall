export interface CopyrightReport {
  sg_table: string;           // 'products' 고정
  sg_id: string;              // 제품 ID (it_id)
  sg_flag: number;            // 3 고정 (제품 신고)
  sg_type: number;            // 6 고정 (저작권 침해)
  sg_desc: string;            // JSON 문자열로 저작권 신고 내용
}

export interface CopyrightReportData {
  content: string;            // 신고 내용
  evidence_urls: string[];    // 증거 파일 URL들
}

export interface ProductForReport {
  it_id: string;
  it_name: string;
  it_img1: string | null;
  it_basic: string;
  ca_id: string;
  ca_name: string;
  creator_id: string;
  creator_name: string;
}

export interface ProductSearchParams {
  ca_id?: string;            // 카테고리 ID
  page?: number;
  limit?: number;
}

export interface ProductSearchResponse {
  success: boolean;
  products: ProductForReport[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface FileUploadResponse {
  success: boolean;
  url?: string;
  error?: string;
}

export interface CopyrightReportResponse {
  success: boolean;
  message?: string;
  error?: string;
} 