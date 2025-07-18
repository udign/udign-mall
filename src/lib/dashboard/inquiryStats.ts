import { executeQuery } from '@/lib/database';

export interface InquiryStats {
  unanswered: number; // 미처리 답변
  reInquiry: number; // 재문의
  answered: number; // 일반 답변
}

// 문의 통계를 가져오는 함수
export const getInquiryStats = async (): Promise<InquiryStats> => {
  try {
    // 1. 미처리 답변 (1:1 문의 + 상품문의)
    const unansweredQuery = `
      SELECT 
        (
          SELECT COUNT(*) 
          FROM g5_qa_content 
          WHERE qa_type = 0 
            AND qa_status = 0
        ) +
        (
          SELECT COUNT(*) 
          FROM g5_shop_item_qa 
          WHERE iq_answer = '' 
            OR iq_answer IS NULL
        ) as count
    `;
    const unansweredResult = (await executeQuery(unansweredQuery)) as Array<{ count: number }>;
    const unanswered = unansweredResult[0]?.count || 0;

    // 2. 재문의 (추가 질문이 있는 문의들)
    const reInquiryQuery = `
      SELECT COUNT(*) as count
      FROM g5_qa_content q1
      WHERE qa_type = 0 
        AND qa_status = 1
        AND EXISTS (
          SELECT 1 
          FROM g5_qa_content q2 
          WHERE q2.qa_related = q1.qa_id 
            AND q2.qa_type = 0
            AND q2.qa_status = 0
        )
    `;
    const reInquiryResult = (await executeQuery(reInquiryQuery)) as Array<{ count: number }>;
    const reInquiry = reInquiryResult[0]?.count || 0;

    // 3. 일반 답변 (답변 완료된 문의들)
    const answeredQuery = `
      SELECT 
        (
          SELECT COUNT(*) 
          FROM g5_qa_content 
          WHERE qa_type = 0 
            AND qa_status = 1
        ) +
        (
          SELECT COUNT(*) 
          FROM g5_shop_item_qa 
          WHERE iq_answer != '' 
            AND iq_answer IS NOT NULL
        ) as count
    `;
    const answeredResult = (await executeQuery(answeredQuery)) as Array<{ count: number }>;
    const answered = answeredResult[0]?.count || 0;

    return {
      unanswered,
      reInquiry,
      answered,
    };
  } catch (error) {
    console.error('Inquiry stats error:', error);
    return {
      unanswered: 0,
      reInquiry: 0,
      answered: 0,
    };
  }
};
