# 유다인 검수 시스템 설계 문서

## 📋 개요

udign-nextjs 프로젝트에 udign-php의 기존 검수 시스템을 참고하여 구현한 현대적인 검수 관리 시스템입니다.

## 🏗️ 시스템 구조

### 1. 폴더 구조

```
udign-nextjs/
├── src/
│   ├── app/
│   │   ├── admin/                    # 관리자 페이지
│   │   │   ├── page.tsx             # 대시보드
│   │   │   └── review/              # 검수 관리
│   │   │       └── page.tsx
│   │   └── api/
│   │       └── admin/
│   │           ├── dashboard/       # 대시보드 API
│   │           │   ├── stats/
│   │           │   └── activities/
│   │           └── review/          # 검수 API
│   │               ├── stats/
│   │               ├── items/
│   │               └── single-action/
│   ├── components/
│   │   └── admin/
│   │       └── AdminLayout.tsx      # 관리자 레이아웃
│   └── types/
│       └── review.ts                # 검수 타입 정의
```

### 2. 핵심 컴포넌트

#### AdminLayout

- 좌측 사이드바 메뉴
- 우측 컨텐츠 영역
- 모바일 반응형 지원
- 계층형 메뉴 구조

#### 대시보드 (admin/page.tsx)

- 통계 카드 (회원, 주문, 매출, 검수)
- 검수 현황 차트
- 최근 활동 피드
- 빠른 액션 버튼

#### 검수 관리 (admin/review/page.tsx)

- 상태별 통계 카드
- 필터링 및 검색
- 상품 목록 테이블
- 상세 정보 모달
- 일괄/개별 승인/반려

## 🔄 검수 프로세스 플로우

### 상태 정의

```typescript
export type ReviewStatus =
  | 'collection' // 컬렉션 단계 (목표 미달성)
  | 'pending' // 검수 대기 (목표 달성)
  | 'in_review' // 심의중 (관리자 토글)
  | 'approved' // 승인
  | 'rejected'; // 반려
```

### 상태 전환 로직 (udign-php 참고)

1. **컬렉션 → 검수 대기**

   - 좋아요 수가 목표(`it_4`) 달성
   - 수동 심의 기간(`it_8`) 도달 (선택적)

2. **검수 대기 → 심의중**

   - 관리자가 `it_10 = 'Y'`로 설정

3. **심의중 → 승인/반려**
   - 승인: `it_10 = 'N'` (심의 종료)
   - 반려: `it_10 = 'R'` (새로운 상태값)

### DB 필드 활용 (기존 g5_shop_item 테이블)

| 필드    | 설명             | 값                              |
| ------- | ---------------- | ------------------------------- |
| `it_4`  | 좋아요 목표 수   | 숫자                            |
| `it_8`  | 심의 기간(일)    | 숫자                            |
| `it_9`  | 수동 심의 여부   | 'Y'/'N'                         |
| `it_10` | 관리자 심의 토글 | 'Y'(심의중)/'N'(승인)/'R'(반려) |

## 🔗 API 명세

### 1. 검수 통계 조회

```
GET /api/admin/review/stats
```

**응답:**

```json
{
  "success": true,
  "data": {
    "total": 150,
    "pending": 12,
    "in_review": 5,
    "approved": 120,
    "rejected": 8,
    "collection": 5
  }
}
```

### 2. 검수 대기 목록 조회

```
GET /api/admin/review/items?page=1&limit=10&status=pending&search=검색어
```

**응답:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "it_id": "1234567890",
        "it_name": "상품명",
        "it_img1": "이미지URL",
        "it_1": "등록자ID",
        "it_2": "작가명",
        "it_3": "작품설명",
        "it_4": 100,
        "interest_count": 120,
        "days_since_created": 5,
        "goal_achieved": true,
        "review_status": "pending"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50,
      "itemsPerPage": 10
    }
  }
}
```

### 3. 단일 승인/반려 처리

```
POST /api/admin/review/single-action
```

**요청:**

```json
{
  "action": "approve", // "approve" | "reject" | "toggle_review"
  "item_id": "1234567890",
  "admin_memo": "관리자 메모",
  "rejection_reason": "반려 사유 (reject시 필수)"
}
```

### 4. 대시보드 통계

```
GET /api/admin/dashboard/stats
```

**응답:**

```json
{
  "success": true,
  "data": {
    "totalMembers": 1500,
    "todayMembers": 12,
    "totalOrders": 850,
    "todayOrders": 5,
    "totalRevenue": 12500000,
    "todayRevenue": 150000,
    "reviewStats": {
      /* 검수 통계 */
    }
  }
}
```

## 🎨 UI/UX 특징

### 디자인 시스템

- **색상**: Tailwind CSS 기반
  - Primary: Blue (600/700)
  - Success: Green (600/700)
  - Warning: Orange (600/700)
  - Danger: Red (600/700)

### 반응형 설계

- 모바일: 스택형 레이아웃, 사이드바 오버레이
- 태블릿: 2컬럼 그리드
- 데스크톱: 좌측 고정 사이드바 + 우측 컨텐츠

### 상호작용

- **로딩 상태**: 스피너 + 텍스트
- **모달**: 배경 오버레이 + 중앙 정렬
- **알림**: 성공/오류 메시지 표시
- **확인**: 반려시 사유 입력 필수

## 🔧 설치 및 설정

### 1. 패키지 설치

```bash
npm install mysql2 lucide-react
npm install -D @types/mysql2
```

### 2. 환경변수 설정 (.env.local)

```env
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=udign
```

### 3. 데이터베이스 연결 테스트

```bash
# 개발 서버 실행
npm run dev

# API 테스트
curl http://localhost:3000/api/admin/review/stats
```

## 📊 검수 상태 계산 로직

### udign-php 호환 로직 구현

```typescript
const calculateReviewStatus = (item: ReviewItem) => {
  const goalAttainment = item.interest_count >= item.it_4;
  const daysPassed = Math.floor(
    (Date.now() - new Date(item.it_time).getTime()) / (1000 * 60 * 60 * 24),
  );
  const reviewDays = parseInt(item.it_8) || 0;
  const manualReview = item.it_9 === 'Y';

  // 1. 관리자 토글 최우선
  if (item.it_10 === 'Y') return 'in_review';
  if (item.it_10 === 'N') return 'approved';
  if (item.it_10 === 'R') return 'rejected';

  // 2. 목표 미달성
  if (!goalAttainment) return 'collection';

  // 3. 목표 달성
  if (manualReview && reviewDays > 0 && daysPassed >= reviewDays) {
    return 'pending';
  }

  return 'pending';
};
```

## 🚀 향후 개발 계획

### Phase 1: 기본 기능 (완료)

- [x] 관리자 레이아웃
- [x] 대시보드
- [x] 검수 목록 조회
- [x] 단일 승인/반려
- [x] API 엔드포인트

### Phase 2: 고급 기능

- [ ] 일괄 처리 기능
- [ ] 검수 로그 테이블 추가
- [ ] 알림 시스템
- [ ] 검수자별 권한 관리

### Phase 3: 최적화

- [ ] 캐싱 구현
- [ ] 성능 최적화
- [ ] 실시간 업데이트 (WebSocket)
- [ ] 모니터링 및 로깅

## 🔒 보안 고려사항

### 인증 및 권한

- 관리자 전용 접근 제한
- API 요청시 관리자 권한 검증
- CSRF 토큰 적용 (필요시)

### 데이터 보호

- SQL Injection 방지 (Prepared Statement)
- XSS 방지 (입력값 검증)
- 민감 정보 로깅 제외

## 📚 참고 자료

### udign-php 참고 파일

- `ajax.review_status.php`: 심의 상태 토글
- `ajax_interest_load.php`: 복잡한 상태 로직
- `returnlist.php`: 승인/거부 UI 패턴
- `admin/index.php`: 대시보드 구조

### 기술 스택

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MySQL (기존 g5_shop_item 테이블 활용)
- **Icons**: Lucide React
- **UI Components**: 커스텀 컴포넌트

---

**작성일**: 2024년 12월
**작성자**: AI Assistant
**버전**: 1.0.0
