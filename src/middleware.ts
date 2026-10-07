import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SESSION_COOKIE_NAME = 'srad_session_token';
const SECRET_KEY = process.env.JWT_SECRET || 'student_result_analysis_secret_key_demo_2026_change_in_production';
const KEY = new TextEncoder().encode(SECRET_KEY);

const PUBLIC_PATHS = ['/login', '/favicon.ico', '/_next', '/api/public'];
const ADMIN_ONLY_PATHS = ['/faculty', '/settings', '/branches/new', '/subjects/new'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets and internal next requests
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/public') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  let user: { id: string; role: string; name: string } | null = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, KEY, { algorithms: ['HS256'] });
      user = {
        id: payload.id as string,
        role: (payload.role as string) || 'FACULTY',
        name: payload.name as string,
      };
    } catch {
      user = null;
    }
  }

  const isLoginPage = pathname === '/login';

  // If user is not authenticated and trying to access a protected page
  if (!user && !isLoginPage && pathname !== '/') {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If root URL, redirect to dashboard or login
  if (pathname === '/') {
    if (user) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If user is already logged in and visiting login page
  if (user && isLoginPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Enforce Admin-only paths in middleware
  if (user && user.role !== 'ADMIN') {
    const isAdminRoute = ADMIN_ONLY_PATHS.some((path) => pathname.startsWith(path));
    if (isAdminRoute) {
      return NextResponse.redirect(new URL('/dashboard?unauthorized=1', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
