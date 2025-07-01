import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

// MySQL 연결 설정
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'udign',
  charset: 'utf8mb4',
};

export const GET = async () => {
  try {
    const connection = await mysql.createConnection(dbConfig);

    // 오늘 날짜
    const today = new Date().toISOString().split('T')[0];

    // 전체 회원 수
    const [totalMembersRows] = await connection.execute(
      'SELECT COUNT(*) as total FROM g5_member WHERE mb_leave_date = ""',
    );
    const totalMembers = (totalMembersRows as any[])[0].total;

    // 오늘 가입한 회원 수
    const [todayMembersRows] = await connection.execute(
      'SELECT COUNT(*) as today FROM g5_member WHERE DATE(mb_datetime) = ? AND mb_leave_date = ""',
      [today],
    );
    const todayMembers = (todayMembersRows as any[])[0].today;

    // 전체 주문 수
    const [totalOrdersRows] = await connection.execute(
      'SELECT COUNT(*) as total FROM g5_shop_order',
    );
    const totalOrders = (totalOrdersRows as any[])[0].total;

    // 오늘 주문 수
    const [todayOrdersRows] = await connection.execute(
      'SELECT COUNT(*) as today FROM g5_shop_order WHERE DATE(od_time) = ?',
      [today],
    );
    const todayOrders = (todayOrdersRows as any[])[0].today;

    // 총 매출 (결제 완료된 주문)
    const [totalRevenueRows] = await connection.execute(
      'SELECT COALESCE(SUM(od_receipt_price), 0) as total FROM g5_shop_order WHERE od_receipt_price > 0',
    );
    const totalRevenue = (totalRevenueRows as any[])[0].total;

    // 오늘 매출
    const [todayRevenueRows] = await connection.execute(
      'SELECT COALESCE(SUM(od_receipt_price), 0) as today FROM g5_shop_order WHERE DATE(od_time) = ? AND od_receipt_price > 0',
      [today],
    );
    const todayRevenue = (todayRevenueRows as any[])[0].today;

    // 검수 현황 통계 (기존 stats API와 동일한 로직)
    const [reviewPendingRows] = await connection.execute(`
      SELECT COUNT(*) as pending 
      FROM g5_shop_item it
      LEFT JOIN (
        SELECT it_id, COUNT(*) as interest_count 
        FROM g5_shop_interrest 
        GROUP BY it_id
      ) interests ON it.it_id = interests.it_id
      WHERE it.it_use = "1" 
      AND COALESCE(interests.interest_count, 0) >= CAST(it.it_4 AS UNSIGNED)
      AND (it.it_10 IS NULL OR it.it_10 = '')
    `);
    const reviewPending = (reviewPendingRows as any[])[0].pending;

    const [reviewInProgressRows] = await connection.execute(
      'SELECT COUNT(*) as in_review FROM g5_shop_item WHERE it_use = "1" AND it_10 = "Y"',
    );
    const reviewInProgress = (reviewInProgressRows as any[])[0].in_review;

    const [reviewApprovedRows] = await connection.execute(
      'SELECT COUNT(*) as approved FROM g5_shop_item WHERE it_use = "1" AND it_10 = "N"',
    );
    const reviewApproved = (reviewApprovedRows as any[])[0].approved;

    const [reviewRejectedRows] = await connection.execute(
      'SELECT COUNT(*) as rejected FROM g5_shop_item WHERE it_use = "1" AND it_10 = "R"',
    );
    const reviewRejected = (reviewRejectedRows as any[])[0].rejected;

    const [reviewCollectionRows] = await connection.execute(`
      SELECT COUNT(*) as collection 
      FROM g5_shop_item it
      LEFT JOIN (
        SELECT it_id, COUNT(*) as interest_count 
        FROM g5_shop_interrest 
        GROUP BY it_id
      ) interests ON it.it_id = interests.it_id
      WHERE it.it_use = "1" 
      AND COALESCE(interests.interest_count, 0) < CAST(it.it_4 AS UNSIGNED)
    `);
    const reviewCollection = (reviewCollectionRows as any[])[0].collection;

    const reviewTotal =
      reviewPending + reviewInProgress + reviewApproved + reviewRejected + reviewCollection;

    await connection.end();

    const dashboardStats = {
      totalMembers,
      todayMembers,
      totalOrders,
      todayOrders,
      totalRevenue,
      todayRevenue,
      reviewStats: {
        total: reviewTotal,
        pending: reviewPending,
        in_review: reviewInProgress,
        approved: reviewApproved,
        rejected: reviewRejected,
        collection: reviewCollection,
      },
    };

    return NextResponse.json({
      success: true,
      data: dashboardStats,
    });
  } catch (error) {
    console.error('대시보드 통계 조회 오류:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
};
