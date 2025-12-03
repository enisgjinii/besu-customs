import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const startTime = Date.now();

  // Get request details
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') || 
             'unknown';
  
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const referer = request.headers.get('referer') || 'direct';
  const method = request.method;
  const url = request.url;
  const pathname = request.nextUrl.pathname;

  // Log all requests to Vercel
  console.log(JSON.stringify({
    type: 'request',
    vercel: true,
    environment: process.env.VERCEL_ENV,
    region: process.env.VERCEL_REGION,
    
    // Request details
    method,
    pathname,
    url,
    
    // Client info
    ip,
    userAgent,
    referer,
    
    // Headers
    acceptLanguage: request.headers.get('accept-language'),
    
    // Timing
    timestamp: new Date().toISOString(),
  }));

  const response = NextResponse.next();

  // Log response time
  response.headers.set('x-response-time', `${Date.now() - startTime}ms`);

  return response;
}

// Configure which routes to log
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
