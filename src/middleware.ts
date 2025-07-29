import { NextRequest, NextResponse } from 'next/server';
import { i18n } from '../i18n.config';
import { match as matchLocale } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';

function getLocale(request: NextRequest): string {
  // 1. 쿠키에서 사용자가 선택한 언어 우선 확인
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  if (cookieLocale && (i18n.locales as readonly string[]).includes(cookieLocale)) {
    return cookieLocale;
  }

  // 2. 브라우저 언어는 fallback으로만 사용
  const negotiatorHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => (negotiatorHeaders[key] = value));

  // @ts-expect-error locales are readonly
  const locales: string[] = i18n.locales;
  const languages = new Negotiator({ headers: negotiatorHeaders }).languages();

  const locale = matchLocale(languages, locales, i18n.defaultLocale);
  return locale;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API 라우트, 정적 파일, admin 경로는 제외
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/admin') ||
    pathname.includes('.')
  ) {
    return;
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
