import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function isTokenValid(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    // Decode base64url payload securely in Edge runtime
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    const payload = JSON.parse(jsonPayload);
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return false; // Token is expired
    }
    return true;
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get('hamic_token')?.value;
  const { pathname } = request.nextUrl;
  const tokenValid = token ? isTokenValid(token) : false;

  // Protect company dashboard
  if (pathname.startsWith('/dashboard')) {
    if (!token || !tokenValid) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      const response = NextResponse.redirect(loginUrl);
      if (token) {
        response.cookies.delete('hamic_token');
      }
      return response;
    }
  }

  // Prevent logged in users from visiting auth pages
  if (pathname === '/login' || pathname === '/register') {
    if (token) {
      if (tokenValid) {
        return NextResponse.redirect(new URL('/', request.url));
      } else {
        // Clear expired/invalid token cookie and let them view login/register
        const response = NextResponse.next();
        response.cookies.delete('hamic_token');
        return response;
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
};
