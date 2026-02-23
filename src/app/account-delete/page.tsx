export default function AccountDeletePage() {
  const email = 'udign0401@naver.com';
  const subject = encodeURIComponent('Account Deletion Request (UDIGN)');
  const body = encodeURIComponent(
    [
      'Hello,',
      '',
      'I would like to request account deletion for UDIGN.',
      '',
      'To help us verify your account, please include one of the following:',
      '- Email used for the account',
      '- Phone number (if any)',
      '- User ID (if known)',
      '',
      'Thank you.',
    ].join('\n')
  );

  const mailto = `mailto:${email}?subject=${subject}&body=${body}`;

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#050B1A',
        color: '#FFFFFF',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <section style={{ width: '100%', maxWidth: 760, padding: '72px 20px' }}>
        <h1 style={{ fontSize: 30, fontWeight: 800, marginBottom: 14, color: '#FFFFFF' }}>
          계정 삭제 요청
        </h1>

        <p style={{ lineHeight: 1.8, marginBottom: 26, opacity: 0.92 }}>
          유다인(UDIGN) 서비스를 더 이상 이용하지 않으시려면 아래 방법으로 계정 삭제를 요청하실 수 있습니다.
          <br />
          <b>로그인 없이</b> 요청 가능합니다.
        </p>

        <h2 style={{ fontSize: 18, fontWeight: 700, margin: '26px 0 10px' }}>
          삭제되는 정보
        </h2>
        <ul style={{ lineHeight: 2.0, paddingLeft: 18, marginBottom: 18, opacity: 0.92 }}>
          <li>계정 정보</li>
          <li>로그인 기록</li>
          <li>서비스 이용 기록</li>
        </ul>

        <h2 style={{ fontSize: 18, fontWeight: 700, margin: '26px 0 10px' }}>
          계정 삭제 요청 방법
        </h2>
        <p style={{ lineHeight: 1.8, marginBottom: 14, opacity: 0.92 }}>
          아래 버튼을 눌러 이메일 작성 화면을 열고, 계정 삭제 요청을 보내주세요.
          <br />
          요청 접수 후 <b>7일 이내</b> 처리됩니다.
        </p>

        {/* ✅ Google Play 통과에 도움되는 "요청 시작" 버튼 */}
        <a
          href={mailto}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px 16px',
            borderRadius: 12,
            fontWeight: 800,
            textDecoration: 'none',
            color: '#FFFFFF',
            background: 'rgba(255,255,255,0.10)',
            border: '1px solid rgba(255,255,255,0.22)',
            boxShadow: '0 10px 24px rgba(0,0,0,0.35)',
          }}
        >
          계정 삭제 요청하기 (이메일 보내기)
        </a>

        <p style={{ marginTop: 14, opacity: 0.88 }}>
          직접 이메일로 보내셔도 됩니다: <b style={{ color: '#FFFFFF' }}>{email}</b>
        </p>

        <hr style={{ margin: '34px 0', border: 0, height: 1, background: 'rgba(255,255,255,0.14)' }} />

        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>
          Account Deletion Request (English)
        </h2>
        <p style={{ lineHeight: 1.8, opacity: 0.92 }}>
          You can request account deletion by clicking the button above. No login is required.
          <br />
          We will process your request within <b>7 days</b>.
          <br />
          Some information may be retained for legal compliance where required.
        </p>
      </section>
    </main>
  );
}
