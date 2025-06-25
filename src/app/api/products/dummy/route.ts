import { NextRequest, NextResponse } from 'next/server';
import { Category, Product } from '@/types/product';

// 더미 데이터 설정
const DUMMY_CONFIG = {
  PRODUCTS_COUNT: 100, // 더미 데이터 개수
  DEFAULT_CATEGORY_ID: '10', // 기본 카테고리 ID
  DEFAULT_LIMIT: 12, // 페이지당 기본 상품 수
};

// 더미 데이터 생성 함수
function generateDummyProducts(count: number, categoryId: string): Product[] {
  const dummyProducts: Product[] = [];
  const fashionNames = [
    '클래식 블레이저',
    '캐주얼 셔츠',
    '데님 재킷',
    '니트 스웨터',
    '롱 코트',
    '미니 드레스',
    '플리츠 스커트',
    '와이드 팬츠',
    '크롭 탑',
    '맥시 드레스',
    '트렌치 코트',
    '카디건',
    '블라우스',
    '점프수트',
    '터틀넥',
    '후드 티셔츠',
    '조거 팬츠',
    '레깅스',
    '원피스',
    '베스트',
    '패딩 재킷',
    '플란넬 셔츠',
    '스키니 진',
    '오버사이즈 티',
    '크롭 재킷',
  ];

  const creators = [
    '김디자이너',
    '박아티스트',
    '이크리에이터',
    '최패션',
    '정스타일',
    '한디자인',
    '윤아트',
    '장크리에이티브',
    '임스튜디오',
    '조브랜드',
    '백패션하우스',
    '신아틀리에',
    '문크래프트',
    '양디자인랩',
    '서스타일',
  ];

  const descriptions = [
    '고급스러운 소재로 제작된 프리미엄 아이템',
    '데일리 룩에 완벽한 베이직 디자인',
    '트렌디한 컬러와 실루엣의 조화',
    '편안함과 스타일을 동시에 만족하는 제품',
    '특별한 날을 위한 엘레간트한 디자인',
    '캐주얼하면서도 세련된 느낌의 아이템',
    '독창적인 패턴과 디테일이 돋보이는 제품',
    '어떤 스타일링에도 잘 어울리는 만능 아이템',
  ];

  for (let i = 0; i < count; i++) {
    const randomId = `dummy_${Date.now()}_${i}`;
    const nameIndex = i % fashionNames.length;
    const creatorIndex = i % creators.length;
    const descIndex = i % descriptions.length;

    dummyProducts.push({
      it_id: randomId,
      it_name: `${fashionNames[nameIndex]} ${i + 1}`,
      it_basic: descriptions[descIndex],
      it_cust_price: Math.floor(Math.random() * 50000) + 30000,
      it_price: Math.floor(Math.random() * 40000) + 25000,
      it_img1: null, // 더미 이미지는 null로 설정
      it_img2: null,
      it_img3: null,
      it_use_avg: Math.floor(Math.random() * 5) + 1,
      it_use_cnt: Math.floor(Math.random() * 100) + 1,
      it_hit: Math.floor(Math.random() * 1000) + 50,
      it_time: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      it_update_time: new Date().toISOString(),
      ca_id: categoryId,
      creator_id: `creator_${creatorIndex}`,
      creator_name: creators[creatorIndex],
      description: descriptions[descIndex],
      likes_count: String(Math.floor(Math.random() * 500) + 10),
    });
  }

  return dummyProducts;
}

// 더미 카테고리 정보 생성
function generateDummyCategory(categoryId: string): Category {
  const categoryNames: { [key: string]: string } = {
    '10': '패션',
    '20': '신발',
    '30': '기타',
  };

  return {
    ca_id: categoryId,
    ca_name: categoryNames[categoryId] || '패션',
    ca_order: 1,
    ca_use: '1',
    ca_img_width: 400,
    ca_img_height: 400,
    ca_list_mod: 4,
    ca_list_row: 3,
    ca_skin: 'basic',
    ca_skin_dir: 'basic',
    ca_head_html: '',
    ca_tail_html: '',
    ca_include_head: '',
    ca_include_tail: '',
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('ca_id') || DUMMY_CONFIG.DEFAULT_CATEGORY_ID;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || String(DUMMY_CONFIG.DEFAULT_LIMIT));
    const offset = (page - 1) * limit;

    // 더미 카테고리 정보 생성
    const category = generateDummyCategory(categoryId);

    // 더미 데이터 생성
    const allDummyProducts = generateDummyProducts(DUMMY_CONFIG.PRODUCTS_COUNT, categoryId);
    const totalCount = allDummyProducts.length;

    // 페이지네이션 적용
    const items = allDummyProducts.slice(offset, offset + limit);

    // 이미지 URL 처리 (더미 데이터는 모두 null이지만 일관성을 위해 public/images/item 폴더 참조 형태로 설정)
    const processedItems = items.map((item) => ({
      ...item,
      it_img1: item.it_img1 ? `/images/item/${item.it_img1}` : null,
      it_img2: item.it_img2 ? `/images/item/${item.it_img2}` : null,
      it_img3: item.it_img3 ? `/images/item/${item.it_img3}` : null,
    }));

    // 개발자를 위한 로그
    console.log(
      `🎭 더미 데이터 API: ${totalCount}개 상품 중 ${items.length}개 반환 (페이지 ${page})`,
    );

    return NextResponse.json({
      success: true,
      category,
      items: processedItems,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
      },
      // 더미 데이터 정보
      _meta: {
        mode: 'dummy',
        generatedAt: new Date().toISOString(),
        totalGenerated: DUMMY_CONFIG.PRODUCTS_COUNT,
      },
    });
  } catch (error) {
    console.error('더미 데이터 생성 오류:', error);
    return NextResponse.json(
      { error: '더미 데이터를 생성하는 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
