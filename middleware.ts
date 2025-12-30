import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { i18nConfig, type Locale } from './i18n.config';

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if pathname already has a locale
  const pathnameHasLocale = i18nConfig.locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) return;

  // Skip for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // Static files like .ico, .svg, etc.
  ) {
    return;
  }

  // Get locale from cookie or Accept-Language header
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  const acceptLanguage = request.headers.get('Accept-Language');
  
  let locale: Locale = i18nConfig.defaultLocale;

  // Check cookie first
  if (cookieLocale && i18nConfig.locales.includes(cookieLocale as Locale)) {
    locale = cookieLocale as Locale;
  } 
  // Then check Accept-Language header
  else if (acceptLanguage) {
    // Check for Tamil
    if (acceptLanguage.includes('ta')) {
      locale = 'ta-in';
    }
  }

  // Redirect to locale-prefixed path
  return NextResponse.redirect(
    new URL(`/${locale}${pathname}`, request.url)
  );
}

export const config = {
  // Match all paths except static files
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)']
};
