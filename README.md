# UDIGN Next.js

유다인 웹사이트의 Next.js 버전입니다.

## 기능

### 인증 시스템

- **회원가입**: 아이디, 비밀번호, 이름, 닉네임, 이메일, 휴대폰번호
- **로그인**: 아이디/비밀번호 기반 인증
- **JWT 토큰**: 세션 관리 및 인증 상태 유지
- **비밀번호 암호화**: bcrypt를 사용한 안전한 비밀번호 저장

### 데이터베이스

- **MySQL**: 그누보드 기반 스키마 활용
- **g5_member 테이블**: 회원 정보 저장
- **연결 풀링**: mysql2 라이브러리 사용

## 설치 및 실행

1. **의존성 설치**

```bash
npm install
```

2. **환경 변수 설정**
   프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가:

```env
# 데이터베이스 설정
DB_HOST=localhost
DB_USER=udign
DB_PASSWORD=dbekdlstjqj!@
DB_NAME=udign

# JWT 시크릿 키 (실제 배포시에는 더 복잡한 키로 변경하세요)
JWT_SECRET=your-very-secure-secret-key-change-this-in-production

# 환경 설정
NODE_ENV=development
```

3. **데이터베이스 설정**

- MySQL 서버가 실행 중인지 확인
- `udign` 데이터베이스가 존재하는지 확인
- `dbconfig/schema_export.sql` 파일을 사용하여 테이블 생성

4. **개발 서버 실행**

```bash
npm run dev
```

## API 엔드포인트

### 인증 관련

- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `POST /api/auth/logout` - 로그아웃
- `GET /api/auth/me` - 현재 사용자 정보 조회

## 페이지

- `/` - 홈페이지
- `/auth` - 로그인/회원가입 페이지

## 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MySQL
- **Authentication**: JWT, bcrypt
- **Icons**: React Icons

## 프로젝트 구조

```
src/
├── app/
│   ├── api/auth/          # 인증 API 엔드포인트
│   ├── auth/              # 로그인/회원가입 페이지
│   ├── components/        # 공통 컴포넌트
│   └── layout.tsx         # 루트 레이아웃
├── components/            # 재사용 가능한 컴포넌트
├── contexts/              # React 컨텍스트
├── lib/                   # 유틸리티 함수
└── types/                 # TypeScript 타입 정의
```

## 사용법

1. **회원가입**

   - `/auth` 페이지에서 "회원가입" 탭 선택
   - 필수 정보 입력 후 가입

2. **로그인**

   - `/auth` 페이지에서 아이디/비밀번호 입력
   - 로그인 성공 시 홈페이지로 리다이렉트

3. **로그아웃**
   - 헤더의 "로그아웃" 버튼 클릭

## 보안 고려사항

- 비밀번호는 bcrypt로 해시화되어 저장
- JWT 토큰은 HttpOnly 쿠키로 관리
- 입력 데이터 검증 및 SQL 인젝션 방지
- CSRF 보호를 위한 SameSite 쿠키 설정
