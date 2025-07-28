import { NextRequest, NextResponse } from 'next/server';
import { i18n } from './i18n.config';
import { match as matchLocale } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';

function getLocale(request: NextRequest): string {
  try {
    const negotiatorHeaders: Record<string, string> = {};
    request.headers.forEach((value, key) => (negotiatorHeaders[key] = value));

    // @ts-expect-error locales are readonly
    const locales: string[] = i18n.locales;
    const languages = new Negotiator({ headers: negotiatorHeaders }).languages();

    const locale = matchLocale(languages, locales, i18n.defaultLocale);
    return locale;
  } catch {
    // fallback to default locale if something goes wrong
    return i18n.defaultLocale;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // API 라우트와 정적 파일은 제외
  if (pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.includes('.')) {
    return;
  }

  const pathnameIsMissingLocale = i18n.locales.every(
    (locale: string) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`,
  );

  if (pathnameIsMissingLocale) {
    const locale = getLocale(request);
    // 루트 경로 처리
    const redirectPath = pathname === '/' ? `/${locale}/shop` : `/${locale}${pathname}`;

    return NextResponse.redirect(new URL(redirectPath, request.url));
  }
}

export const config = {
  // Matcher ignoring `/_next/` and `/api/` and `/assets`
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|assets).*)'],
};
