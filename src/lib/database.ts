import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'udign',
  password: process.env.DB_PASSWORD || 'dbekdlstjqj!@',
  database: process.env.DB_NAME || 'udign',
  charset: 'utf8mb4',
};

// MySQL 데이터베이스 연결 생성
export const getConnection = async () => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    return connection;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
};

// SQL 쿼리 실행 결과 반환
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
