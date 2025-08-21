// Next.js 13+ App Router için Route Handler konfigürasyonu
// Bu dosya, API rotalarında kullanılmak üzere import edilebilir

// App Router için doğru konfigürasyon değerleri
export const dynamic = 'force-dynamic'; // Her zaman dinamik olarak çalıştır
export const dynamicParams = true; // Dinamik parametrelere izin ver
export const revalidate = 0; // Her istekte yeniden doğrula
export const runtime = 'nodejs'; // Node.js runtime kullan

// Boyut limitini artırmak için özel bir fonksiyon
export async function parseBodyWithLargeLimit(request, options = {}) {
  const contentType = request.headers.get('content-type') || '';
  
  if (contentType.includes('multipart/form-data')) {
    // FormData için
    return await request.formData();
  } else if (contentType.includes('application/json')) {
    // JSON için
    return await request.json();
  } else {
    // Binary veri için (dosya yükleme)
    return await request.blob();
  }
}
