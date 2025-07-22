import { emailStyles } from './styles';

export interface PasswordLostEmailData {
  memberName: string;
  memberNick: string;
  memberId: string;
  memberEmail: string;
  changePassword: string;
  certifyUrl: string;
  siteName: string;
  siteUrl: string;
  timestamp: string;
}

export const PasswordLostTemplate = (data: PasswordLostEmailData): string => {
  const {
    memberName,
    memberNick,
    memberId,
    changePassword,
    certifyUrl,
    siteName,
    siteUrl,
    timestamp,
  } = data;

  return `
    <!doctype html>
    <html lang="ko">
    <head>
      <meta charset="utf-8">
      <title>회원정보 찾기 안내 메일</title>
      <style>
        ${emailStyles}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="inner">
          <h1 class="header">회원정보 찾기 안내</h1>
          <span class="site-link">
            <a href="${siteUrl}" target="_blank">${siteName}</a>
          </span>
          <div class="content">
            <p><strong>${memberName} (${memberNick})</strong> 회원님은 ${timestamp}에 회원정보 찾기 요청을 하셨습니다.</p>
            <p>저희 사이트는 관리자라도 회원님의 비밀번호를 알 수 없기 때문에, 비밀번호를 알려드리는 대신 새로운 비밀번호를 생성하여 안내 해드리고 있습니다.</p>
            <p>아래에서 변경될 비밀번호를 확인하신 후, <a href="${certifyUrl}" target="_blank" style="color:#ff3061 !important; text-decoration:underline !important; font-weight:bold; border-bottom: 2px solid #ff3061;"><strong>비밀번호 변경</strong> 링크를 클릭 하십시오.</a></p>
            <p>비밀번호가 변경되었다는 인증 메세지가 출력되면, 홈페이지에서 회원아이디와 변경된 비밀번호를 입력하시고 로그인 하십시오.</p>
            <p>로그인 후에는 정보수정 메뉴에서 새로운 비밀번호로 변경해 주십시오.</p>
            
            <div class="member-info">
              <p><strong>회원아이디:</strong> <span style="font-size: 1.1em; color: #333;">${memberId}</span></p>
              <p><strong>변경될 비밀번호:</strong> <span style="color:#ff3061; font-weight:bold; font-size: 1.2em; background: #fff3f6; padding: 3px 8px; border-radius: 4px; border: 1px solid #ff3061;">${changePassword}</span></p>
            </div>
          </div>
        </div>
        <div class="cta-container">
          <a href="${certifyUrl}" target="_blank" class="cta-button">지금 비밀번호 변경하기</a>
        </div>
      </div>
    </body>
    </html>
  `;
};
