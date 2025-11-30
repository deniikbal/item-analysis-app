import { NextRequest, NextResponse } from 'next/server';
import { validateRequest } from '@/lib/auth-utils';

export async function middleware(request: NextRequest) {
  // Pass pathname to headers for navbar active state
  const response = NextResponse.next();
  response.headers.set('x-pathname', request.nextUrl.pathname);
  
  // Rute publik yang tidak memerlukan autentikasi
  const publicPaths = ['/auth/login', '/auth/register'];
  const { user } = await validateRequest();
  const isAuthenticated = !!user;

  // Jika path adalah publik, izinkan akses
  if (publicPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
    // Jika pengguna sudah login dan mencoba mengakses halaman login/register, redirect ke dashboard
    if (isAuthenticated && 
        (request.nextUrl.pathname.startsWith('/auth/login') || 
         request.nextUrl.pathname.startsWith('/auth/register'))) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Jika bukan path publik dan pengguna tidak login, redirect ke login
  if (!isAuthenticated && !request.nextUrl.pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Untuk semua rute lainnya, lanjutkan
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};