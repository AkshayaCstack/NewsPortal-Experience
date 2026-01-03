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
  // ============================================
  const projectUid = process.env.NEXT_PUBLIC_PERSONALIZATION_PROJECT_UID;

  // If personalization is not configured, continue without it
  if (!projectUid) {
    return NextResponse.next();
  }

  // Check auth state transitions - skip stale personalization during transitions
  const authState = request.cookies.get('cs_auth_state')?.value;
  if (authState === 'signed_out' || authState === 'signed_in') {
    console.log('[Middleware] Auth state transition:', authState, '- skipping stale personalization');
    // Clear the auth state cookie and continue without personalization
    // Next page load will have fresh Lytics cookies
    const response = NextResponse.next();
    response.cookies.delete('cs_auth_state');
    // Also clear stale personalize cookies
    response.cookies.delete('cs-personalize-manifest');
    response.cookies.delete('cs-personalize-user-id');
    return response;
  }

  // CONTENTSTACK PERSONALIZE
  try {
    console.log('[Middleware] Initializing Personalize with project:', projectUid);
    
    // Debug: Log all cookies to see what Lytics has set
    const allCookies = request.cookies.getAll();
    const lyticsCookies = allCookies.filter(c => c.name.includes('lytics') || c.name.includes('seerid'));
    console.log('[Middleware] Lytics cookies found:', lyticsCookies.map(c => c.name));
    
    // Initialize Personalize SDK - it will read Lytics cookies automatically
    // Lytics audiences are evaluated based on user profile stored in Lytics
    const sdk = await Personalize.init(projectUid, { 
      request: request as unknown as Request,
    });

    // Get variant aliases from SDK
    const variantAliases = sdk.getVariantAliases(); 
    console.log('[Middleware] Variant aliases from SDK:', variantAliases);
    
    // Get experiences to see what's active - THIS is the reliable source of truth
    const experiences = sdk.getExperiences();
    console.log('[Middleware] Active experiences:', JSON.stringify(experiences));
    
    // Get the Lytics user ID
    const userId = sdk.getUserId();
    console.log('[Middleware] Lytics/Personalize User ID:', userId);
    
    const url = request.nextUrl.clone();
    
    // Pass variant alias for Contentstack SDK
    if (variantAliases.length > 0) {
      url.searchParams.set('variant', variantAliases.join(','));
      console.log('[Middleware] Set variant param:', variantAliases.join(','));
    }
    
    // CRITICAL: Pass the activeVariantShortUid directly - this is reliable!
    // From experience object: { shortUid: '0', activeVariantShortUid: '0' or '1' }
    if (experiences && experiences.length > 0) {
      const activeExp = experiences[0];
      if (activeExp.activeVariantShortUid !== null) {
        url.searchParams.set('variantUid', activeExp.activeVariantShortUid);
        console.log('[Middleware] Set variantUid param:', activeExp.activeVariantShortUid);
      }
    }

    const response = NextResponse.rewrite(url);
    await sdk.addStateToResponse(response as unknown as Response);
    
    console.log('[Middleware] Returning rewritten response');
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
