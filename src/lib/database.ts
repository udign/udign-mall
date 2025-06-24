import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'udign',
  password: process.env.DB_PASSWORD || 'dbekdlstjqj!@',
  database: process.env.DB_NAME || 'udign',
  charset: 'utf8mb4',
};

/**
 * MySQL 데이터베이스 연결을 생성합니다.
 *
 * @returns {Promise<mysql.Connection>} MySQL 연결 객체
 * @throws {Error} 데이터베이스 연결 실패 시 에러를 던집니다
 *
 * @example
 * ```typescript
 * const connection = await getConnection();
 * // 연결 사용 후 반드시 connection.end() 호출 필요
 * ```
 */
export const getConnection = async () => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    return connection;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
};

/**
 * SQL 쿼리를 안전하게 실행하고 결과를 반환합니다.
 * Prepared statements를 사용하여 SQL 인젝션을 방지합니다.
 *
 * @param {string} query - 실행할 SQL 쿼리문 (플레이스홀더로 ? 사용)
 * @param {unknown[]} params - 쿼리의 플레이스홀더에 바인딩될 값들의 배열
 * @returns {Promise<unknown>} 쿼리 실행 결과
 *
 * @example
 * ```typescript
 * // SELECT 쿼리 실행
 * const users = await executeQuery(
 *   'SELECT * FROM g5_member WHERE mb_id = ?',
 *   ['testuser']
 * );
 *
 * // INSERT 쿼리 실행
 * await executeQuery(
 *   'INSERT INTO g5_member (mb_id, mb_name) VALUES (?, ?)',
 *   ['testuser', '홍길동']
 * );
 * ```
 */
export const executeQuery = async (query: string, params: unknown[] = []) => {
  const connection = await getConnection();
  try {
    const [results] = await connection.execute(query, params);
    return results;
  } finally {
    // 쿼리 실행 완료 후 반드시 연결을 종료하여 리소스 누수 방지
    await connection.end();
  }
};
