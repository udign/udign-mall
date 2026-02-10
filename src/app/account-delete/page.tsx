export default function AccountDeletePage() {
  return (
    <main
      style={{
        padding: '48px 24px',
        maxWidth: '720px',
        margin: '0 auto',
        color: '#ffffff',          // ✅ 글씨 흰색
        lineHeight: '1.7',         // ✅ 줄 간격
      }}
    >
      <h1 style={{ marginBottom: '24px' }}>
        계정 삭제 요청
      </h1>

      <p style={{ marginBottom: '16px' }}>
        유다인(UDIGN) 서비스를 더 이상 이용하지 않으시려면
        아래 방법을 통해 계정 삭제를 요청하실 수 있습니다.
      </p>

      <h2 style={{ marginTop: '32px', marginBottom: '12px' }}>
        삭제되는 정보
      </h2>

      <ul style={{ marginBottom: '24px', paddingLeft: '20px' }}>
        <li>계정 정보</li>
        <li>로그인 기록</li>
        <li>서비스 이용 기록</li>
      </ul>

      <h2 style={{ marginTop: '32px', marginBottom: '12px' }}>
        계정 삭제 요청 방법
      </h2>

      <p style={{ marginBottom: '12px' }}>
        아래 이메일로 계정 삭제 요청을 보내주세요.
      </p>

      <p style={{ marginBottom: '12px' }}>
        요청 접수 후 7일 이내 처리됩니다.
      </p>

      <p style={{ marginTop: '20px', fontWeight: 'bold' }}>
        📧 udign0401@naver.com
      </p>
    </main>
  );
