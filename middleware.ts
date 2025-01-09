import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAuth } from "@clerk/nextjs/server";

// Define subdomain mappings
const subdomains: Record<string, string> = {
  'pay': '/pay',
  'admin': '/admin',
  'api': '/api'
}

export async function middleware(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    const hostname = request.headers.get('host') || '';
    const path = request.nextUrl.pathname;
    
    // Skip auth for public routes
    const isPublicRoute = path.startsWith('/sign-in') || path.startsWith('/sign-up');
    
    // Extract subdomain from hostname
    const subdomain = hostname.split('.')[0];
    
    // Handle subdomain routing first
    if (subdomain && subdomains[subdomain]) {
      const url = request.nextUrl.clone();
      // Only rewrite if we're not already on the correct path
      if (!path.startsWith(subdomains[subdomain])) {
        url.pathname = `${subdomains[subdomain]}${path === '/' ? '' : path}`;
        return NextResponse.rewrite(url);
      }
    }

    // Handle auth after subdomain routing
    if (!isPublicRoute && !userId) {
      const signInUrl = new URL('/sign-in', request.url);
      signInUrl.searchParams.set('redirect_url', request.url);
      return NextResponse.redirect(signInUrl);
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};