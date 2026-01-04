import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import Personalize from '@contentstack/personalize-edge-sdk';
import { i18nConfig, type Locale } from './i18n.config';

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // Static files like .ico, .svg, etc.
  ) {
    return NextResponse.next();
  }

  // Check if pathname already has a locale
  const pathnameHasLocale = i18nConfig.locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // Handle locale redirect first
  if (!pathnameHasLocale) {
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
      if (acceptLanguage.includes('ta')) {
        locale = 'ta-in';
      }
    }

    // Redirect to locale-prefixed path
    return NextResponse.redirect(
      new URL(`/${locale}${pathname}`, request.url)
    );
  }

  // ============================================
  // CONTENTSTACK PERSONALIZE INTEGRATION
  // Middleware is STATELESS - just passes variant
  // ============================================
  const projectUid = process.env.NEXT_PUBLIC_PERSONALIZATION_PROJECT_UID;

  // If personalization is not configured, continue without it
  if (!projectUid) {
    return NextResponse.next();
  }

  try {
    // Initialize Personalize SDK
    const sdk = await Personalize.init(projectUid, { 
      request: request as unknown as Request,
    });

    // Get variant aliases from SDK
    const variantAliases = sdk.getVariantAliases();

    const url = request.nextUrl.clone();
    
    // Pass variant alias for Contentstack SDK to fetch correct entry variant
    if (variantAliases.length > 0) {
      url.searchParams.set('variant', variantAliases.join(','));
    }

    const response = NextResponse.rewrite(url);
    await sdk.addStateToResponse(response as unknown as Response);
    
    return response;
  } catch (error) {
    console.error('[Middleware] Personalization error:', error);
    // Continue without personalization on error
    return NextResponse.next();
  }
}

export const config = {
  // Match all paths except static files
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)']
};
