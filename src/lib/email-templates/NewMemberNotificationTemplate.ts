import { emailStyles } from './styles';

interface NewMemberNotificationData {
  memberName: string;
  memberId: string;
  memberNick: string;
  memberEmail: string;
  siteName: string;
  siteUrl: string;
}

export const NewMemberNotificationTemplate = ({
  memberName,
  memberId,
  memberNick,
  memberEmail,
  siteName,
  siteUrl,
}: NewMemberNotificationData): string => {
  return `
    <!doctype html>
    <html lang="ko">
    <head>
      <meta charset="utf-8">
      <title>회원가입 알림 메일</title>
      <style>
        ${emailStyles}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="inner">
          <h1 class="header">회원가입 알림 메일</h1>
          <span class="site-link">
            <a href="${siteUrl}" target="_blank">${siteName}</a>
          </span>
          <div class="content">
            <p><strong>${memberName}</strong> 님께서 회원가입 하셨습니다.</p>
            <div class="member-info">
              <p><strong>회원 아이디:</strong> ${memberId}</p>
              <p><strong>회원 이름:</strong> ${memberName}</p>
              <p><strong>회원 닉네임:</strong> ${memberNick}</p>
              <p><strong>이메일:</strong> ${memberEmail}</p>
            </div>
          </div>
          <a href="${siteUrl}/admin/members" target="_blank" class="cta-button">관리자에서 회원정보 확인하기</a>
        </div>
      </div>
    </body>
    </html>
  `;
};
