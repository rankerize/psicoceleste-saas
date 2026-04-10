import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('__session')?.value
    || request.cookies.get('firebase-auth-token')?.value;

  const isAuthPage = request.nextUrl.pathname.startsWith('/auth');
  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard');
  const isBateria = request.nextUrl.pathname.startsWith('/bateria');

  // Batería pública — acceso libre
  if (isBateria) return NextResponse.next();

  // Si no hay sesión y trata de entrar al dashboard → login
  if (isDashboard && !token) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Si hay sesión y está en auth → dashboard
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*'],
};
