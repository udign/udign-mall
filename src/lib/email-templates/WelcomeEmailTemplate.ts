import { emailStyles } from './styles';

interface WelcomeEmailData {
  memberName: string;
  siteName: string;
  siteUrl: string;
}

export const WelcomeEmailTemplate = ({
  memberName,
  siteName,
  siteUrl,
}: WelcomeEmailData): string => {
  return `
    <!doctype html>
    <html lang="ko">
    <head>
      <meta charset="utf-8">
      <title>회원가입 축하 메일</title>
      <style>
        ${emailStyles}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="inner">
          <h1 class="header">회원가입을 축하합니다.</h1>
          <span class="site-link">
            <a href="${siteUrl}" target="_blank">${siteName}</a>
          </span>
          <div class="content">
            <p><strong>${memberName}</strong> 님의 회원가입을 진심으로 축하합니다.</p>
            <p>회원님의 성원에 보답하고자 더욱 더 열심히 하겠습니다.</p>
            <p>감사합니다.</p>
          </div>
          <a href="${siteUrl}" target="_blank" class="cta-button">사이트 바로가기</a>
        </div>
      </div>
    </body>
    </html>
  `;
};
