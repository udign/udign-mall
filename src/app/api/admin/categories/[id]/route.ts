import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, getConnection } from '@/lib/database';
import { RowDataPacket } from 'mysql2';
import {
  Category,
  CategoryUpdateRequest,
  CategoryDetailApiResponse,
  CategoryUpdateApiResponse,
  CategoryDeleteApiResponse,
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

// 하위 카테고리 찾기
async function findDescendants(categoryId: string): Promise<Category[]> {
  const rows = (await executeQuery(
    `
    SELECT ca_id, ca_name, ca_order, ca_use,
           NULL as created_at, NULL as updated_at
    FROM g5_shop_category 
    WHERE ca_id LIKE ? AND ca_id != ?
  `,
    [categoryId + '%', categoryId],
  )) as RowDataPacket[];

  return rows.map(dbRowToCategory);
}

// GET: 카테고리 상세 조회
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: categoryId } = await params;

    const rows = (await executeQuery(
      `
      SELECT ca_id, ca_name, ca_order, ca_use,
             NULL as created_at, NULL as updated_at
      FROM g5_shop_category 
      WHERE ca_id = ?
    `,
      [categoryId],
    )) as RowDataPacket[];

    if (rows.length === 0) {
      const response: CategoryDetailApiResponse = {
        success: false,
        error: '카테고리를 찾을 수 없습니다.',
      };
      return NextResponse.json(response, { status: 404 });
    }

    const category = dbRowToCategory(rows[0]);

    // 하위 카테고리도 함께 조회
    const childRows = (await executeQuery(
      `
      SELECT ca_id, ca_name, ca_order, ca_use,
             NULL as created_at, NULL as updated_at
      FROM g5_shop_category 
      WHERE ca_id LIKE ? AND LENGTH(ca_id) = ?
      ORDER BY ca_order, ca_id
    `,
      [categoryId + '%', categoryId.length + 2],
    )) as RowDataPacket[];

    const children = childRows.map(dbRowToCategory);

    const categoryWithChildren: Category = {
      ...category,
      children: children.length > 0 ? children : undefined,
    };

    const response: CategoryDetailApiResponse = {
      success: true,
      data: categoryWithChildren,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('카테고리 조회 실패:', error);

    const response: CategoryDetailApiResponse = {
      success: false,
      error: '카테고리 조회 중 오류가 발생했습니다.',
    };

    return NextResponse.json(response, { status: 500 });
  }
}

// PUT: 카테고리 수정
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const connection = await getConnection();

  try {
    const { id: categoryId } = await params;
    const body: CategoryUpdateRequest = await request.json();

    // 카테고리 존재 확인
    const existingRows = (await executeQuery(
      `
      SELECT ca_id, ca_name, ca_order, ca_use
      FROM g5_shop_category 
      WHERE ca_id = ?
    `,
      [categoryId],
    )) as RowDataPacket[];

    if (existingRows.length === 0) {
      const response: CategoryUpdateApiResponse = {
        success: false,
        error: '카테고리를 찾을 수 없습니다.',
      };
      return NextResponse.json(response, { status: 404 });
    }

    const existingCategory = dbRowToCategory(existingRows[0]);

    // 유효성 검증 (이름이 제공된 경우에만)
    if (body.name !== undefined && (!body.name || body.name.trim().length < 2)) {
      const response: CategoryUpdateApiResponse = {
        success: false,
        error: '카테고리명은 2글자 이상 입력해주세요.',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // 상위 카테고리 변경 시 순환 참조 검증
    if (body.parentId && body.parentId !== existingCategory.parentId) {
      // 자기 자신을 상위로 설정하는 것 방지
      if (body.parentId === categoryId) {
        const response: CategoryUpdateApiResponse = {
          success: false,
          error: '자기 자신을 상위 카테고리로 설정할 수 없습니다.',
        };
        return NextResponse.json(response, { status: 400 });
      }

      // 하위 카테고리를 상위로 설정하는 것 방지
      const descendants = await findDescendants(categoryId);
      if (descendants.some((desc) => desc.id === body.parentId)) {
        const response: CategoryUpdateApiResponse = {
          success: false,
          error: '하위 카테고리를 상위 카테고리로 설정할 수 없습니다.',
        };
        return NextResponse.json(response, { status: 400 });
      }

      // 새 상위 카테고리 존재 확인
      const parentRows = (await executeQuery(
        `
        SELECT ca_id FROM g5_shop_category WHERE ca_id = ?
      `,
        [body.parentId],
      )) as RowDataPacket[];

      if (parentRows.length === 0) {
        const response: CategoryUpdateApiResponse = {
          success: false,
          error: '존재하지 않는 상위 카테고리입니다.',
        };
        return NextResponse.json(response, { status: 400 });
      }
    }

    await connection.beginTransaction();

    // 카테고리 업데이트 (동적 쿼리 생성)
    const updateFields: string[] = [];
    const updateValues: (string | number)[] = [];

    if (body.name !== undefined) {
      updateFields.push('ca_name = ?');
      updateValues.push(body.name.trim());
    }

    if (body.order !== undefined) {
      updateFields.push('ca_order = ?');
      updateValues.push(body.order);
    }

    if (body.isActive !== undefined) {
      updateFields.push('ca_use = ?');
      updateValues.push(body.isActive ? 1 : 0);
    }

    if (updateFields.length === 0) {
      const response: CategoryUpdateApiResponse = {
        success: false,
        error: '업데이트할 필드가 없습니다.',
      };
      return NextResponse.json(response, { status: 400 });
    }

    updateValues.push(categoryId);

    await connection.execute(
      `UPDATE g5_shop_category SET ${updateFields.join(', ')} WHERE ca_id = ?`,
      updateValues,
    );

    await connection.commit();

    // 업데이트된 카테고리 정보 반환
    const updatedCategory: Category = {
      ...existingCategory,
      name: body.name !== undefined ? body.name.trim() : existingCategory.name,
      order: body.order !== undefined ? body.order : existingCategory.order,
      isActive: body.isActive !== undefined ? body.isActive : existingCategory.isActive,
      updatedAt: new Date().toISOString(),
    };

    const response: CategoryUpdateApiResponse = {
      success: true,
      data: updatedCategory,
      message: '카테고리가 성공적으로 수정되었습니다.',
    };

    return NextResponse.json(response);
  } catch (error) {
    await connection.rollback();
    console.error('카테고리 수정 실패:', error);

    const response: CategoryUpdateApiResponse = {
      success: false,
      error: '카테고리 수정 중 오류가 발생했습니다.',
    };

    return NextResponse.json(response, { status: 500 });
  } finally {
    await connection.end();
  }
}

// DELETE: 카테고리 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const connection = await getConnection();

  try {
    const { id: categoryId } = await params;

    // 카테고리 존재 확인
    const categoryRows = (await executeQuery(
      `
      SELECT ca_id, ca_name FROM g5_shop_category WHERE ca_id = ?
    `,
      [categoryId],
    )) as RowDataPacket[];

    if (categoryRows.length === 0) {
      const response: CategoryDeleteApiResponse = {
        success: false,
        error: '카테고리를 찾을 수 없습니다.',
      };
      return NextResponse.json(response, { status: 404 });
    }

    // 하위 카테고리 확인
    const childRows = (await executeQuery(
      `
      SELECT COUNT(*) as count FROM g5_shop_category 
      WHERE ca_id LIKE ? AND ca_id != ?
    `,
      [categoryId + '%', categoryId],
    )) as RowDataPacket[];

    if (childRows[0].count > 0) {
      const response: CategoryDeleteApiResponse = {
        success: false,
        error:
          '하위 카테고리가 있는 카테고리는 삭제할 수 없습니다. 먼저 하위 카테고리를 삭제해주세요.',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // 해당 카테고리에 연결된 상품이 있는지 확인
    const productRows = (await executeQuery(
      `
      SELECT COUNT(*) as count FROM g5_shop_item 
      WHERE ca_id = ? OR ca_id2 = ? OR ca_id3 = ?
    `,
      [categoryId, categoryId, categoryId],
    )) as RowDataPacket[];

    if (productRows[0].count > 0) {
      const response: CategoryDeleteApiResponse = {
        success: false,
        error: '이 카테고리에 연결된 상품이 있어 삭제할 수 없습니다.',
      };
      return NextResponse.json(response, { status: 400 });
    }

    await connection.beginTransaction();

    // 카테고리 삭제
    await connection.execute(
      `
      DELETE FROM g5_shop_category WHERE ca_id = ?
    `,
      [categoryId],
    );

    await connection.commit();

    const response: CategoryDeleteApiResponse = {
      success: true,
      data: { id: categoryId },
      message: '카테고리가 성공적으로 삭제되었습니다.',
    };

    return NextResponse.json(response);
  } catch (error) {
    await connection.rollback();
    console.error('카테고리 삭제 실패:', error);

    const response: CategoryDeleteApiResponse = {
      success: false,
      error: '카테고리 삭제 중 오류가 발생했습니다.',
    };

    return NextResponse.json(response, { status: 500 });
  } finally {
    await connection.end();
  }
}
