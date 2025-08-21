import { NextResponse } from 'next/server';

// Next.js 13+ için middleware ile istekleri işle
export function middleware(request) {
  // Büyük dosya yüklemeleri için gerekli ayarları yap
  const response = NextResponse.next();
  
  // Uzun süreli bağlantılar için keep-alive ekle
  response.headers.set('Connection', 'keep-alive');
  
  return response;
}

// Hangi yollar için middleware çalışacak
export const config = {
  matcher: ['/api/files/:path*', '/api/files/download/get'],
};