import { NextRequest, NextResponse } from 'next/server';

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting configuration
const RATE_LIMIT = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // limit each IP to 100 requests per windowMs
  apiWindowMs: 60 * 1000, // 1 minute for API routes
  apiMaxRequests: 30, // limit each IP to 30 API requests per minute
};

function getRateLimitKey(ip: string, path: string): string {
  return `${ip}:${path.startsWith('/api') ? 'api' : 'web'}`;
}

function checkRateLimit(ip: string, path: string): boolean {
  const key = getRateLimitKey(ip, path);
  const now = Date.now();
  const isApiRoute = path.startsWith('/api');
  const windowMs = isApiRoute ? RATE_LIMIT.apiWindowMs : RATE_LIMIT.windowMs;
  const maxRequests = isApiRoute ? RATE_LIMIT.apiMaxRequests : RATE_LIMIT.maxRequests;

  const record = rateLimitStore.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  
  // Security: Block requests with x-middleware-subrequest header (CVE-2025-29927 protection)
  if (request.headers.get('x-middleware-subrequest')) {
    console.warn(`Blocked request with x-middleware-subrequest header from IP: ${ip}`);
    return NextResponse.json(
      { error: 'Forbidden: Invalid request header' },
      { status: 403 }
    );
  }

  // Rate limiting
  if (!checkRateLimit(ip, pathname)) {
    console.warn(`Rate limit exceeded for IP: ${ip}, path: ${pathname}`);
    return NextResponse.json(
      { error: 'Too Many Requests' },
      { 
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Limit': pathname.startsWith('/api') ? '30' : '100',
          'X-RateLimit-Remaining': '0',
        }
      }
    );
  }

  // CORS configuration
  const allowedOrigins = [
    'http://localhost:48321',
    'http://127.0.0.1:48321',
    // Add your production domains here
  ];
  
  const origin = request.headers.get('origin');
  const isAllowedOrigin = !origin || allowedOrigins.includes(origin);

  // Create response
  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requires unsafe-inline and unsafe-eval
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);

  // CORS headers
  if (isAllowedOrigin && origin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: response.headers });
  }

  // Note: Authentication is handled at the API route level
  // to avoid Edge Runtime compatibility issues with database connections

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
  runtime: 'nodejs',
};