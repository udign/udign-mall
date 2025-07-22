import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { getCurrentUser } from '@/lib/auth';
import { MEMBER_LEVELS } from '@/lib/constants';

export interface SizeGuideData {
  id: number;
  area: string;
  size_s: string;
  size_m: string;
  size_l: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SizeGuideUpdateRequest {
  area: string;
  size_s: string;
  size_m: string;
  size_l: string;
  sort_order: number;
  is_active: boolean;
}

// 사이즈 가이드 조회
export const GET = async () => {
  try {
    // 테이블 존재 확인 및 없으면 생성
    await ensureSizeGuideTable();

    const rows = (await executeQuery(`
      SELECT * FROM g5_size_guide 
      WHERE is_active = true 
      ORDER BY sort_order ASC, id ASC
    `)) as SizeGuideData[];

    // 테이블이 비어있으면 기본 데이터 삽입
    if (rows.length === 0) {
      await insertDefaultSizeGuideData();
      const defaultRows = (await executeQuery(`
        SELECT * FROM g5_size_guide 
        WHERE is_active = true 
        ORDER BY sort_order ASC, id ASC
      `)) as SizeGuideData[];

      return NextResponse.json({ success: true, data: defaultRows });
    }

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error('사이즈 가이드 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '사이즈 가이드를 불러오는데 실패했습니다.' },
      { status: 500 },
    );
  }
};

// 사이즈 가이드 전체 업데이트
export const PUT = async (request: NextRequest) => {
  try {
    // 관리자 권한 확인
    const user = await getCurrentUser();
    if (!user || user.mb_level < MEMBER_LEVELS.ADMIN) {
      return NextResponse.json(
        { success: false, error: '관리자 권한이 필요합니다.' },
        { status: 403 },
      );
    }

    const { data }: { data: SizeGuideUpdateRequest[] } = await request.json();

    if (!Array.isArray(data)) {
      return NextResponse.json(
        { success: false, error: '올바른 데이터 형식이 아닙니다.' },
        { status: 400 },
      );
    }

    // 테이블 존재 확인 및 없으면 생성
    await ensureSizeGuideTable();

    // 기존 데이터 모두 삭제
    await executeQuery('DELETE FROM g5_size_guide');

    // 새 데이터 삽입
    for (const item of data) {
      await executeQuery(
        `INSERT INTO g5_size_guide (area, size_s, size_m, size_l, sort_order, is_active, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [item.area, item.size_s, item.size_m, item.size_l, item.sort_order, item.is_active],
      );
    }

    return NextResponse.json({
      success: true,
      message: '사이즈 가이드가 성공적으로 업데이트되었습니다.',
    });
  } catch (error) {
    console.error('사이즈 가이드 업데이트 오류:', error);
    return NextResponse.json(
      { success: false, error: '사이즈 가이드 업데이트에 실패했습니다.' },
      { status: 500 },
    );
  }
};

// 사이즈 가이드 테이블 존재 확인 및 생성
const ensureSizeGuideTable = async () => {
  try {
    // 먼저 기본 테이블 생성 (size_l 없이)
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS g5_size_guide (
        id INT AUTO_INCREMENT PRIMARY KEY,
        area VARCHAR(100) NOT NULL COMMENT '측정 부위',
        size_s VARCHAR(50) NOT NULL COMMENT 'S 사이즈 측정값',
        size_m VARCHAR(50) NOT NULL COMMENT 'M 사이즈 측정값',
        sort_order INT DEFAULT 0 COMMENT '정렬 순서',
        is_active BOOLEAN DEFAULT TRUE COMMENT '활성 상태',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='사이즈 가이드 정보'
    `);

    // size_l 컬럼이 존재하는지 확인
    const columns = (await executeQuery(`
      SHOW COLUMNS FROM g5_size_guide LIKE 'size_l'
    `)) as unknown[];

    // size_l 컬럼이 없으면 추가
    if (columns.length === 0) {
      await executeQuery(`
        ALTER TABLE g5_size_guide 
        ADD COLUMN size_l VARCHAR(50) NOT NULL DEFAULT '' COMMENT 'L 사이즈 측정값'
        AFTER size_m
      `);
    }
  } catch (error) {
    console.error('사이즈 가이드 테이블 생성 오류:', error);
    throw error;
  }
};

// 기본 사이즈 가이드 데이터 삽입
const insertDefaultSizeGuideData = async () => {
  const defaultData = [
    { area: 'A - 가슴 둘레', size_s: '56.5', size_m: '59.0', size_l: '61.5', sort_order: 1 },
    { area: 'B - 암핏 길이', size_s: '65.0', size_m: '66.0', size_l: '67.0', sort_order: 2 },
    { area: 'C - 소매 길이', size_s: '21.5', size_m: '22.0', size_l: '22.5', sort_order: 3 },
    { area: 'D - 등 너비', size_s: '54.5', size_m: '56.5', size_l: '58.5', sort_order: 4 },
    { area: 'E - 밑 너비', size_s: '19.0', size_m: '20.0', size_l: '21.0', sort_order: 5 },
  ];

  for (const item of defaultData) {
    await executeQuery(
      `INSERT INTO g5_size_guide (area, size_s, size_m, size_l, sort_order, is_active, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, true, NOW(), NOW())`,
      [item.area, item.size_s, item.size_m, item.size_l, item.sort_order],
    );
  }
};
