export default function AccountDeletePage() {
  const email = 'udign0401@naver.com';
  const subject = encodeURIComponent('Account Deletion Request (UDIGN)');
  const body = encodeURIComponent(
    [
      'Hello,',
      '',
      'I would like to request account deletion for UDIGN.',
      '',
      'Please include one of the following to help us verify your account:',
      '- Email used for the account',
      '- Phone number (if any)',
      '- User ID (if known)',
      '',
      'Thank you.',
    ].join('\n')
  );

  const mailto = `mailto:${email}?subject=${subject}&body=${body}`;

  return (
    <main style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center' }}>
      <section style={{ width: '100%', maxWidth: 720, padding: '64px 20px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 16 }}>계정 삭제 요청</h1>

        <p style={{ lineHeight: 1.7, marginBottom: 24 }}>
          유다인(UDIGN) 서비스를 더 이상 이용하지 않으시려면 아래 방법으로 계정 삭제를 요청하실 수 있습니다.
          <br />
          (로그인 없이 진행 가능합니다.)
        </p>

        <h2 style={{ fontSize: 18, fontWeight: 700, margin: '28px 0 12px' }}>삭제되는 정보</h2>
        <ul style={{ lineHeight: 1.9, marginBottom: 18, paddingLeft: 18 }}>
          <li>계정 정보</li>
          <li>로그인 기록</li>
          <li>서비스 이용 기록</li>
        </ul>

        <h2 style={{ fontSize: 18, fontWeight: 700, margin: '28px 0 12px' }}>계정 삭제 요청 방법</h2>
        <p style={{ lineHeight: 1.7, marginBottom: 14 }}>
          아래 버튼을 눌러 이메일 작성 화면을 열고, 계정 삭제 요청을 보내주세요.
          <br />
          요청 접수 후 <b>7일 이내</b> 처리됩니다.
        </p>

        {/* ✅ 이 버튼(또는 링크)이 없으면 재거절이 자주 납니다 */}
        <a
          href={mailto}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px 16px',
            borderRadius: 10,
            fontWeight: 700,
            textDecoration: 'none',
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          계정 삭제 요청하기 (이메일 보내기)
        </a>

        <p style={{ marginTop: 14, opacity: 0.9 }}>
          또는 아래 이메일로 직접 보내셔도 됩니다: <b>{email}</b>
        </p>

        <hr style={{ margin: '32px 0', opacity: 0.25 }} />

        {/* ✅ 영문 안내(리뷰 통과율↑) */}
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 12px' }}>
          Account Deletion Request (English)
        </h2>
        <p style={{ lineHeight: 1.7 }}>
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
