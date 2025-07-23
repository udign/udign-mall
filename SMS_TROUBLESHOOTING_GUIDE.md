# 무통장 입금 SMS 발송 문제 해결 가이드

## 🔍 문제 진단

결제 페이지에서 무통장 입금을 선택하고 결제 시 SMS가 발송되지 않는 문제의 원인을 파악하고 해결하는 방법을 안내합니다.

## 📱 SMS 진단 도구 사용

1. **관리자 페이지 접속**

   - URL: `http://localhost:3000/admin/sms/diagnose`
   - 또는 관리자 메뉴 > SMS 관리 > SMS 진단

2. **진단 결과 확인**
   - 전체 상태: 정상/경고/오류
   - 오류 목록: 해결해야 할 문제점들
   - 경고 목록: 권장 개선사항들
   - 권장사항: 구체적인 해결 방법

## 🛠️ 주요 해결 방법

### 1. SMS 기본 설정

**문제**: SMS 사용이 비활성화되어 있습니다
**해결 방법**:

1. 관리자 페이지 > SMS 설정 (`/admin/sms/config`)
2. 아이코드 인증정보 입력:
   - **토큰키 방식**: 아이코드 사이트에서 토큰키 발급 후 입력 (권장)
   - **ID/PW 방식**: 아이코드 ID와 비밀번호 입력
3. 회신번호 입력 (예: 010-1234-5678)
4. 설정 저장

### 2. 무통장 입금 계좌번호 설정

**문제**: 무통장입금 계좌번호가 설정되지 않았습니다
**해결 방법**:

1. 데이터베이스에서 `g5_shop_default` 테이블의 `de_bank_account` 필드에 계좌번호 입력
2. 또는 관리자 페이지에서 쇼핑몰 기본설정에서 계좌번호 설정

**SQL 예시**:

```sql
UPDATE g5_shop_default
SET de_bank_account = '은행명: 계좌번호\n예금주: 회사명'
WHERE de_id = 1;
```

### 3. SMS 사용 설정 활성화

**문제**: 무통장입금 SMS 사용이 비활성화되어 있습니다
**해결 방법**:
SMS 설정에서 자동으로 활성화되지만, 수동으로 확인하려면:

```sql
UPDATE g5_config
SET de_sms_use2 = 1, de_sms_use3 = 1
WHERE cf_id = 1;
```

## 📋 체크리스트

### 필수 설정 확인

- [ ] 아이코드 SMS 서비스 신청 완료
- [ ] 아이코드 인증정보 설정 (토큰키 또는 ID/PW)
- [ ] 회신번호 설정
- [ ] 무통장입금 계좌번호 설정
- [ ] 무통장입금 SMS 사용 활성화 (de_sms_use2 = 1)

### 데이터베이스 테이블 확인

- [ ] `g5_config` 테이블에 SMS 관련 컬럼 존재
- [ ] `g5_shop_default` 테이블에 계좌번호 데이터 존재

## 🔧 개발자 디버깅

### 1. 브라우저 개발자 도구에서 콘솔 로그 확인

무통장 입금 결제 시 다음과 같은 로그가 출력됩니다:

```javascript
// 정상적인 경우
🚀 주문 생성 완료, SMS 발송 확인 시작: {...}
📱 SMS 설정 확인 결과: {...}
✅ SMS 발송 조건 충족, 발송 시작: {...}
🏦 무통장입금 SMS 발송 시작
🏦 무통장입금 SMS 발송 결과: {success: true, ...}
```

```javascript
// 문제가 있는 경우
❌ 무통장입금 SMS 발송 조건 불충족: {...}
SMS 발송 조건이 충족되지 않았습니다: {...}
```

### 2. API 테스트

**SMS 발송 가능 여부 확인**:

```bash
curl http://localhost:3000/api/admin/sms/send
```

**SMS 진단 API 호출**:

```bash
curl http://localhost:3000/api/admin/sms/diagnose
```

### 3. 데이터베이스 직접 확인

```sql
-- SMS 기본 설정 확인
SELECT cf_sms_use, cf_icode_id, cf_icode_token_key, cf_phone,
       de_sms_use2, de_sms_use3
FROM g5_config;

-- 계좌번호 확인
SELECT de_bank_account FROM g5_shop_default;

-- 주문 생성 확인
SELECT * FROM g5_shop_order ORDER BY od_time DESC LIMIT 5;
```

## 🚨 자주 발생하는 문제

### 1. 아이코드 인증 오류

- **증상**: "SMS 인증 정보가 설정되지 않았습니다"
- **해결**: 아이코드 웹사이트에서 계정 확인 및 토큰키 재발급

### 2. 회신번호 오류

- **증상**: "회신번호가 설정되지 않았습니다"
- **해결**: 아이코드에 사전 등록된 발신번호와 동일한 번호 입력

### 3. 계좌번호 누락

- **증상**: SMS에 "계좌정보를 설정해주세요"가 포함됨
- **해결**: `g5_shop_default.de_bank_account` 필드에 계좌번호 입력

### 4. 테이블 컬럼 누락

- **증상**: "g5_config 테이블에 필요한 컬럼이 없습니다"
- **해결**: SMS 설정 페이지에서 한 번 저장하면 자동으로 컬럼 생성됨

## 📞 추가 지원

1. **아이코드 SMS 서비스 신청**: [http://icodekorea.com](http://icodekorea.com)
2. **SMS 진단 도구**: `/admin/sms/diagnose`
3. **SMS 설정 페이지**: `/admin/sms/config`

## 🔄 테스트 방법

1. SMS 설정 완료 후 진단 도구에서 "정상" 상태 확인
2. 테스트 주문으로 무통장 입금 선택
3. 입력한 전화번호로 SMS 수신 확인
4. SMS 내용에 계좌번호와 입금액이 정확히 포함되었는지 확인
