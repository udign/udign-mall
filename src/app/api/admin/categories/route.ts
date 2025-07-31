import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, getConnection } from '@/lib/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import {
  Category,
  CategoryCreateRequest,
  CategoryListApiResponse,
  CategoryCreateApiResponse,
  CategoryFilter,
} from '@/types/category';

// 데이터베이스 행을 Category 타입으로 변환
function dbRowToCategory(row: RowDataPacket): Category {
  return {
    id: row.ca_id,
    name: row.ca_name,
    parentId: getParentId(row.ca_id),
    level: Math.ceil(row.ca_id.length / 2),
    order: row.ca_order || 0,
    isActive: row.ca_use === 1,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

// 카테고리 ID에서 상위 카테고리 ID 추출
function getParentId(categoryId: string): string | undefined {
  if (categoryId.length <= 2) return undefined;
  return categoryId.substring(0, categoryId.length - 2);
}

// 카테고리를 계층 구조로 변환
function buildCategoryTree(categories: Category[]): Category[] {
  const categoryMap = new Map<string, Category>();
  const rootCategories: Category[] = [];

  // 먼저 모든 카테고리를 맵에 추가
  categories.forEach((category) => {
    categoryMap.set(category.id, { ...category, children: [] });
  });

  // 계층 구조 구성
  categories.forEach((category) => {
    const cat = categoryMap.get(category.id)!;

    if (category.parentId) {
      const parent = categoryMap.get(category.parentId);
      if (parent) {
        if (!parent.children) parent.children = [];
        parent.children.push(cat);
      }
    } else {
      rootCategories.push(cat);
    }
  });

  return rootCategories;
}

// 다음 카테고리 ID 생성
async function generateNextCategoryId(parentId?: string): Promise<string> {
  try {
    if (!parentId || parentId === '') {
      // 1단계 카테고리: 10, 20, 30, ...
      const rows = (await executeQuery(`
        SELECT ca_id FROM g5_shop_category 
        WHERE LENGTH(ca_id) = 2 
        ORDER BY CAST(ca_id AS UNSIGNED)
      `)) as RowDataPacket[];

      let nextId = 10;
      for (const row of rows) {
        const id = parseInt(row.ca_id);
        if (id === nextId) {
          nextId += 10;
        } else {
          break;
        }
      }
      return nextId.toString();
    } else {
      // 하위 카테고리: 부모ID + 10, 20, 30, ...
      const rows = (await executeQuery(
        `
        SELECT ca_id FROM g5_shop_category 
        WHERE ca_id LIKE ? AND LENGTH(ca_id) = ?
        ORDER BY ca_id
      `,
        [parentId + '%', parentId.length + 2],
      )) as RowDataPacket[];

      let nextSuffix = 10;
      for (const row of rows) {
        const suffix = parseInt(row.ca_id.slice(parentId.length));
        if (suffix === nextSuffix) {
          nextSuffix += 10;
        } else {
          break;
        }
      }

      return parentId + nextSuffix.toString().padStart(2, '0');
    }
  } catch (error) {
    console.error('카테고리 ID 생성 실패:', error);
    throw error;
  }
}

// GET: 카테고리 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 쿼리 파라미터 파싱
    const filter: CategoryFilter = {
      search: searchParams.get('search') || undefined,
      parentId: searchParams.get('parentId') || undefined,
      isActive: searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined,
      level: searchParams.get('level') ? parseInt(searchParams.get('level')!) : undefined,
    };

    const tree = searchParams.get('tree') === 'true';

    // 기본 쿼리
    let whereClause = 'WHERE 1=1';
    const queryParams: any[] = [];

    // 검색 조건 추가
    if (filter.search) {
      whereClause += ' AND ca_name LIKE ?';
      queryParams.push(`%${filter.search}%`);
    }

    if (filter.parentId !== undefined) {
      if (filter.parentId === '') {
        whereClause += ' AND LENGTH(ca_id) = 2';
      } else {
        whereClause += ' AND ca_id LIKE ? AND LENGTH(ca_id) = ?';
        queryParams.push(filter.parentId + '%');
        queryParams.push(filter.parentId.length + 2);
      }
    }

    if (filter.isActive !== undefined) {
      whereClause += ' AND ca_use = ?';
      queryParams.push(filter.isActive ? 1 : 0);
    }

    if (filter.level) {
      whereClause += ' AND LENGTH(ca_id) = ?';
      queryParams.push(filter.level * 2);
    }

    // 카테고리 조회
    const rows = (await executeQuery(
      `
      SELECT ca_id, ca_name, ca_order, ca_use,
             NULL as created_at, NULL as updated_at
      FROM g5_shop_category 
      ${whereClause}
      ORDER BY ca_order, ca_id
    `,
      queryParams,
    )) as RowDataPacket[];

    const categories = rows.map(dbRowToCategory);
    const responseData = tree ? buildCategoryTree(categories) : categories;

    const response: CategoryListApiResponse = {
      success: true,
      data: {
        categories: responseData,
        total: categories.length,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('카테고리 목록 조회 실패:', error);

    const response: CategoryListApiResponse = {
      success: false,
      error: '카테고리 목록을 불러오는 중 오류가 발생했습니다.',
    };

    return NextResponse.json(response, { status: 500 });
  }
}

// POST: 새 카테고리 생성
export async function POST(request: NextRequest) {
  const connection = await getConnection();

  try {
    const body: CategoryCreateRequest = await request.json();

    // 유효성 검증
    if (!body.name || body.name.trim().length < 2) {
      const response: CategoryCreateApiResponse = {
        success: false,
        error: '카테고리명은 2글자 이상 입력해주세요.',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // 상위 카테고리 존재 확인
    if (body.parentId) {
      const parentRows = (await executeQuery(
        `
        SELECT ca_id FROM g5_shop_category WHERE ca_id = ?
      `,
        [body.parentId],
      )) as RowDataPacket[];

      if (parentRows.length === 0) {
        const response: CategoryCreateApiResponse = {
          success: false,
          error: '존재하지 않는 상위 카테고리입니다.',
        };
        return NextResponse.json(response, { status: 400 });
      }
    }

    // 새 카테고리 ID 생성
    const newId = await generateNextCategoryId(body.parentId);
    const level = Math.ceil(newId.length / 2);

    // 레벨 제한 확인 (최대 5단계)
    if (level > 5) {
      const response: CategoryCreateApiResponse = {
        success: false,
        error: '카테고리는 최대 5단계까지만 생성할 수 있습니다.',
      };
      return NextResponse.json(response, { status: 400 });
    }

    await connection.beginTransaction();

    // 새 카테고리 생성
    await connection.execute(
      `
      INSERT INTO g5_shop_category (
        ca_id, ca_name, ca_order, ca_use,
        ca_skin_dir, ca_mobile_skin_dir, ca_skin, ca_mobile_skin,
        ca_img_width, ca_img_height, ca_mobile_img_width, ca_mobile_img_height,
        ca_list_mod, ca_list_row, ca_mobile_list_mod, ca_mobile_list_row,
        ca_stock_qty, ca_explan_html, ca_cert_use, ca_adult_use, ca_nocoupon
      ) VALUES (
        ?, ?, ?, ?,
        '', '', 'list.10.skin.php', 'list.10.skin.php',
        150, 150, 150, 150,
        3, 5, 3, 5,
        99999, 1, 0, 0, 0
      )
    `,
      [newId, body.name.trim(), body.order || 0, body.isActive ? 1 : 0],
    );

    await connection.commit();

    // 생성된 카테고리 정보 반환
    const newCategory: Category = {
      id: newId,
      name: body.name.trim(),
      parentId: body.parentId || undefined,
      level,
      order: body.order || 0,
      isActive: body.isActive,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const response: CategoryCreateApiResponse = {
      success: true,
      data: newCategory,
      message: '카테고리가 성공적으로 생성되었습니다.',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    await connection.rollback();
    console.error('카테고리 생성 실패:', error);

    const response: CategoryCreateApiResponse = {
      success: false,
      error: '카테고리 생성 중 오류가 발생했습니다.',
    };

    return NextResponse.json(response, { status: 500 });
  } finally {
    await connection.end();
  }
}
