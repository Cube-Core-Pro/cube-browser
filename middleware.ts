/**
 * CUBE Nexum v7 - Next.js Middleware (Edge-Compatible)
 * 
 * Production middleware with route protection.
 * Uses only Edge Runtime compatible APIs.
 * 
 * Features:
 * - Security headers
 * - CORS handling
 * - Route protection based on cookies
 * - Domain-specific authentication
 * 
 * Authentication Domains:
 * - /admin/* uses cube_admin_token
 * - /affiliates/dashboard/* uses cube_affiliate_token
 * - /investors/dashboard/* uses cube_investor_token
 * - /licenses/* uses cube_admin_token
 * 
 * Public Routes (No Auth Required):
 * - /get, /pricing, /affiliates, /investors (landing pages)
 * - /login, /signup, and login pages for each domain
 * 
 * @module middleware
 */

import { NextResponse, type NextRequest } from 'next/server';

// =============================================================================
// Configuration
// =============================================================================

/**
 * Routes that should skip middleware entirely
 */
const SKIP_MIDDLEWARE = [
  '/_next',
  '/static',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
];

/**
 * Public routes - no authentication required
 */
const PUBLIC_ROUTES = [
  '/',
  '/get',
  '/pricing',
  '/about',
  '/contact',
  '/legal',
  '/terms',
  '/privacy',
  '/login',
  '/signup',
  '/forgot-password',
  '/affiliates',
  '/affiliates/login',
  '/affiliates/signup',
  '/investors',
  '/investors/login',
  '/admin/login',
  '/docs',
];

/**
 * Protected routes with their required cookie tokens
 */
const PROTECTED_ROUTES: { pattern: RegExp; cookie: string; loginPath: string }[] = [
  // Admin routes - require admin token
  { pattern: /^\/admin(?!\/login)/, cookie: 'cube_admin_token', loginPath: '/admin/login' },
  
  // Affiliate dashboard routes - require affiliate token
  { pattern: /^\/affiliates\/(dashboard|analytics|payouts|settings)/, cookie: 'cube_affiliate_token', loginPath: '/affiliates/login' },
  
  // Investor dashboard routes - require investor token
  { pattern: /^\/investors\/(dashboard|contracts|documents|payouts|settings)/, cookie: 'cube_investor_token', loginPath: '/investors/login' },
  
  // License management - require admin token
  { pattern: /^\/licenses/, cookie: 'cube_admin_token', loginPath: '/admin/login' },
];

// =============================================================================
// Middleware Function
// =============================================================================

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static assets
  if (SKIP_MIDDLEWARE.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }
  
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return handleCORS(request);
  }
  
  // Check if route requires authentication
  const protectedRoute = PROTECTED_ROUTES.find(route => route.pattern.test(pathname));
  
  if (protectedRoute) {
    const token = request.cookies.get(protectedRoute.cookie)?.value;
    
    if (!token) {
      // Redirect to appropriate login page
      const loginUrl = new URL(protectedRoute.loginPath, request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // Token exists - we trust it here, full validation happens in API routes
    // This is Edge-compatible since we're not doing JWT verification
  }
  
  // Create response with security headers
  const response = NextResponse.next();
  
  // Add security headers
  addSecurityHeaders(response);
  
  // Add CORS headers for API routes
  if (pathname.startsWith('/api/')) {
    addCORSHeaders(response, request);
  }
  
  return response;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Handle CORS preflight requests
 */
function handleCORS(request: NextRequest): NextResponse {
  const response = new NextResponse(null, { status: 204 });
  addCORSHeaders(response, request);
  return response;
}

/**
 * Add security headers to response
 */
function addSecurityHeaders(response: NextResponse): void {
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // XSS protection
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions policy
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
}

/**
 * Add CORS headers for API routes
 */
function addCORSHeaders(response: NextResponse, request: NextRequest): void {
  const origin = request.headers.get('origin');
  
  // Allow all origins in production (can be restricted via env)
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];
  
  if (origin && (allowedOrigins.includes('*') || allowedOrigins.includes(origin))) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  } else if (allowedOrigins.includes('*')) {
    response.headers.set('Access-Control-Allow-Origin', '*');
  }
  
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, X-Request-ID');
  response.headers.set('Access-Control-Max-Age', '86400');
}

// =============================================================================
// Middleware Config
// =============================================================================

export const config = {
  matcher: [
    // Match all paths except static files
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
