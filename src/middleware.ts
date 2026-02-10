import { NextRequest, NextResponse } from 'next/server';
import { i18n } from '../i18n.config';
import { match as matchLocale } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';

function getLocale(request: NextRequest): string {
  try {
    // 1. 쿠키 확인
    const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
    if (cookieLocale && (i18n.locales as readonly string[]).includes(cookieLocale)) {
      return cookieLocale;
    }

    // 2. 브라우저 언어 추출 시도
    const negotiatorHeaders: Record<string, string> = {};
    request.headers.forEach((value, key) => (negotiatorHeaders[key] = value));

    const languages = new Negotiator({ headers: negotiatorHeaders }).languages();
    
    // languages가 비어있거나 유효하지 않으면 바로 기본값 반환
    if (!languages || languages.length === 0 || languages[0] === '*') {
      return i18n.defaultLocale;
    }

    // @ts-expect-error locales are readonly
    const supportedLocales: string[] = i18n.locales;

    // 3. 매칭 시도 (에러 발생 가능성이 높은 구간을 try-catch로 보호)
    return matchLocale(languages, supportedLocales, i18n.defaultLocale);
  } catch (error) {
    // 어떤 에러가 나더라도 사이트가 멈추지 않도록 기본 언어(ko 등)를 반환
    console.error('Locale matching error:', error);
    return i18n.defaultLocale;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API 라우트, 정적 파일, admin 경로는 제외
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/admin') ||
    pathname === '/sitemap.xml' ||
    pathname === '/robots.txt' ||
    pathname.includes('.')
  ) {
    return;
  }
  if (pathname.startsWith('/account-delete')) {
  return NextResponse.next();
}
  const pathnameHasLocale = i18n.locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  );

  if (pathnameHasLocale) return;

  const locale = getLocale(request);
  request.nextUrl.pathname = `/${locale}${pathname}`;

  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  // Matcher ignoring `/_next/` and `/api/` and `/assets`
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|assets).*)'],
};
