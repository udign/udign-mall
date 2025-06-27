# UDIGN Next.js - My UDIGN 기능

## 개요

이 프로젝트는 UDIGN 프리오더 시스템의 "나의 작품 현황" 기능을 Next.js로 구현한 것입니다.

## 구현된 기능

### 1. My UDIGN 페이지 (`/my-udign`)

- 사용자의 관심 작품 현황을 상태별로 분류하여 표시
- 프리오더 시스템의 7단계 프로세스 플로우 시각화
- 상태별 탭으로 작품 분류 및 필터링

### 2. 상태 분류 시스템

```
- 전체: 모든 작품
- ❤️ 디자인: 좋아요한 작품 (목표 미달성)
- 제작 검토: 심의 진행 중인 작품
- 구매 진행: 구매 가능한 작품
- 주문 확정: 결제 완료된 작품
- 상품 제작: 제작 중인 작품
- 배송 진행: 배송 중인 작품
- 수령 완료: 완료된 작품
- 취소/반품/품절: 취소되거나 문제가 있는 작품
```

### 3. 주요 컴포넌트

#### 페이지 및 레이아웃

- `src/app/my-udign/page.tsx`: 메인 페이지
- `src/components/ProcessFlow.tsx`: 7단계 프로세스 플로우
- `src/components/StatusTabs.tsx`: 상태별 탭 네비게이션

#### 작품 표시

- `src/components/ArtworkCard.tsx`: 개별 작품 카드
- `src/components/ProgressBar.tsx`: 6단계 진행 상태바

#### 모달 및 액션

- `src/components/ReturnModal.tsx`: 교환/반품 신청 모달
- `src/components/CancelOrderModal.tsx`: 주문 취소 모달

### 4. API 라우트

#### 데이터 조회

- `GET /api/my-udign`: 사용자의 작품 현황 데이터 조회

#### 액션 처리

- `POST /api/my-udign/interest`: 관심 상품 토글
- `POST /api/my-udign/cancel-order`: 주문 취소
- `POST /api/my-udign/confirm-purchase`: 구매 확정
- `POST /api/my-udign/return`: 교환/반품 신청

### 5. 데이터베이스 연동

#### 서비스 레이어

- `src/lib/artwork-service.ts`: 작품 관련 비즈니스 로직
- `src/lib/database.ts`: MySQL 연결 및 쿼리 실행

#### 타입 정의

- `src/types/artwork.ts`: 작품 관련 TypeScript 타입

### 6. 상태 결정 로직

작품의 현재 상태는 다음 우선순위로 결정됩니다:

1. **장바구니 상태 우선**: 주문이 진행 중인 경우
2. **관리자 토글**: `it_10` 필드로 강제 심의 제어
3. **목표 달성 여부**: 좋아요 수가 목표에 도달했는지 확인
4. **심의 방식**: 자동/수동 심의 설정에 따른 처리

### 7. 사용된 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Database**: MySQL with mysql2
- **Authentication**: JWT 토큰 기반 인증

### 8. 주요 특징

- **실시간 상태 업데이트**: 액션 후 자동 데이터 새로고침
- **반응형 디자인**: 모바일 및 데스크톱 호환
- **모달 기반 인터랙션**: 직관적인 사용자 경험
- **상태 시각화**: 진행 단계별 프로그레스 바
- **관리자 기능**: 심의 상태 토글 (관리자만)

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 프로덕션 실행
npm start
```

## 환경 변수

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=udign
DB_PASSWORD=your_password
DB_NAME=udign
JWT_SECRET=your_jwt_secret
```

이 구현은 기존 PHP 버전의 기능을 완전히 재현하면서도 Next.js의 장점을 활용한 현대적인 웹 애플리케이션입니다.
