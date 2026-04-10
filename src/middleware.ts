import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('__session')?.value
    || request.cookies.get('firebase-auth-token')?.value;

  const { pathname } = request.nextUrl;
  const isAuthPage  = pathname.startsWith('/auth');
  const isDashboard = pathname.startsWith('/dashboard');

  // Si no hay sesión y trata de entrar al dashboard → login
  if (isDashboard && !token) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Si ya tiene sesión y está en login/registro → dashboard
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*'],
};
