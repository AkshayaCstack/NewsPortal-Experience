import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import Personalize from '@contentstack/personalize-edge-sdk';
import { i18nConfig, type Locale } from './i18n.config';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check if pathname already has a locale
  const pathnameHasLocale = i18nConfig.locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

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

  // Handle locale redirect first
  if (!pathnameHasLocale) {
    return NextResponse.redirect(
      new URL(`/${locale}${pathname}`, request.url)
    );
  }

  // ============================================
  // CONTENTSTACK PERSONALIZE INTEGRATION
  // Runs on EVERY request to ensure fresh variant
  // ============================================
  const projectUid = process.env.NEXT_PUBLIC_PERSONALIZATION_PROJECT_UID;

  // If personalization is not configured, continue without it
  if (!projectUid) {
    console.warn('[Middleware] NEXT_PUBLIC_PERSONALIZATION_PROJECT_UID not set!');
    const response = NextResponse.next();
    response.headers.set('x-locale', locale);
    response.headers.set('cache-control', 'no-store, must-revalidate');
    return response;
  }
  
  // Log environment for debugging
  const isProduction = process.env.NODE_ENV === 'production';
  console.log('[Middleware] Environment:', isProduction ? 'PRODUCTION' : 'DEVELOPMENT');

  try {
    // Set custom edge API URL if provided
    if (process.env.NEXT_PUBLIC_CONTENTSTACK_PERSONALIZE_EDGE_API_URL) {
      Personalize.setEdgeApiUrl(process.env.NEXT_PUBLIC_CONTENTSTACK_PERSONALIZE_EDGE_API_URL);
    }

    // Create a proper Request object for Personalize SDK
    // The SDK expects a Request-like object with Headers that have .get() method
    const headers = new Headers();
    
    // Copy all headers from the original request
    request.headers.forEach((value, key) => {
      headers.set(key, value);
    });

    // Add cookies to headers (SDK reads cookies from Cookie header)
    const cookieString = request.cookies
      .getAll()
      .map(cookie => `${cookie.name}=${cookie.value}`)
      .join('; ');
    
    if (cookieString) {
      headers.set('Cookie', cookieString);
    }

    // Create Request object that the SDK expects
    const personalizeRequest = new Request(request.url, {
      method: request.method,
      headers: headers,
    });

    console.log('=== [Middleware] PERSONALIZE DEBUG ===');
    console.log('[Middleware] Path:', pathname);
    console.log('[Middleware] Project UID:', projectUid);
    
    // Log relevant cookies for debugging
    const relevantCookies = request.cookies.getAll().filter(c => 
      c.name.includes('seer') || 
      c.name.includes('lytics') || 
      c.name.includes('personalize') ||
      c.name.includes('cs-')
    );
    console.log('[Middleware] Relevant cookies:', relevantCookies.map(c => `${c.name}=${c.value.substring(0, 30)}...`));
    
    // Initialize Personalize SDK with the proper request
    const sdk = await Personalize.init(projectUid, { 
      request: personalizeRequest,
    });

    // Get the variant parameter from the SDK
    const variantParam = sdk.getVariantParam();
    const variantAliases = sdk.getVariantAliases();
    const userId = sdk.getUserId?.();
    
    console.log('[Middleware] Variant param:', variantParam);
    console.log('[Middleware] Variant aliases:', variantAliases);
    console.log('[Middleware] User ID:', userId);

    // Create response and set variant in HEADER + COOKIE (fallback for platforms that strip headers)
    const response = NextResponse.next();
    
    // Add SDK state to response (sets personalization cookies)
    await sdk.addStateToResponse(response as unknown as Response);
    
    // Set headers - this is how we pass variant to the page
    response.headers.set('x-locale', locale);
    response.headers.set('cache-control', 'no-store, must-revalidate');
    
    if (variantParam) {
      // Set variant in HEADER (primary method)
      response.headers.set('x-personalize-variant', variantParam);
      
      // Also set variant in COOKIE (fallback for production environments that strip headers)
      response.cookies.set('x-personalize-variant', variantParam, {
        path: '/',
        httpOnly: false, // Allow client-side access if needed
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 60, // Short-lived, just for this request cycle
      });
      
      console.log('[Middleware] Set x-personalize-variant:', variantParam);
    }
    
    console.log('=== [Middleware] END DEBUG ===');
    return response;

  } catch (error) {
    console.error('[Middleware] Personalization error:', error);
    
    // Don't block the request if Personalize fails
    const response = NextResponse.next();
    response.headers.set('x-locale', locale);
    response.headers.set('cache-control', 'no-store, must-revalidate');
    return response;
  }
}

export const config = {
  // Match all paths except static files
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
