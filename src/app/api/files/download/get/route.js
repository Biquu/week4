import { getSessionTicketFromRequest } from "@/lib/session-store";
import { generateRequestId, logInfo, logError } from "@/lib/safe-logger";
import { NextResponse } from "next/server";

// Bu route doğrudan dosya indirme işlemi için kullanılır
// GET metodu ile çağrılır ve dosyayı doğrudan kullanıcıya sunar

export async function GET(request) {
  const requestId = generateRequestId();
  try {
    // URL parametrelerini al
    const { searchParams } = new URL(request.url);
    const ticketId = searchParams.get("ticketID");
    const klasorYolu = searchParams.get("klasorYolu");
    const dosyaAdi = searchParams.get("dosyaAdi");

    console.log(`[files:download:get:${requestId}] İndirme isteği alındı:`, {
      ticketId,
      klasorYolu,
      dosyaAdi
    });

    // Parametreleri kontrol et
    if (!ticketId) {
      console.error(`[files:download:get:${requestId}] Ticket ID eksik`);
      return new Response("Ticket ID gerekli", { status: 400 });
    }

    if (!dosyaAdi) {
      console.error(`[files:download:get:${requestId}] Dosya adı eksik`);
      return new Response("Dosya adı gerekli", { status: 400 });
    }

    // API URL'sini oluştur
    const baseUrl = process.env.API_BASE_URL || "https://test.divvydrive.com/Test/Staj";
    
    console.log(`[files:download:get:${requestId}] API URL:`, baseUrl + "/DosyaIndir");

    // Basic Auth bilgilerini hazırla
    const username = process.env.API_AUTH_USER || "NDSServis";
    const password = process.env.API_AUTH_PASS || "ca5094ef-eae0-4bd5-a94a-14db3b8f3950";
    const basicAuth = Buffer.from(`${username}:${password}`).toString("base64");

    // API'ye istek gönder - DosyaIndir POST metodu ile çağrılmalı
    const response = await fetch(baseUrl + "/DosyaIndir", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${basicAuth}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ticketID: ticketId,
        klasorYolu: klasorYolu || "",
        dosyaAdi: dosyaAdi,
        indirilecekYol: ""
      })
    });

    console.log(`[files:download:get:${requestId}] API yanıtı:`, {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    // API yanıtı başarısızsa hata döndür
    if (!response.ok) {
      console.error(`[files:download:get:${requestId}] API hatası:`, {
        status: response.status,
        statusText: response.statusText
      });
      
      // API'den gelen yanıtı kontrol et
      const errorText = await response.text();
      console.error(`[files:download:get:${requestId}] API hata detayı:`, errorText);
      
      return new Response(`Dosya indirilemedi: ${response.statusText}`, {
        status: response.status
      });
    }

    // Content-Type ve Content-Disposition başlıklarını al
    const contentType = response.headers.get("Content-Type") || "application/octet-stream";
    const contentDisposition = response.headers.get("Content-Disposition") || `attachment; filename="${encodeURIComponent(dosyaAdi)}"`;
    const contentLength = response.headers.get("Content-Length");

    console.log(`[files:download:get:${requestId}] Dosya indiriliyor:`, {
      contentType,
      contentDisposition,
      contentLength
    });

    // Dosya içeriğini oku
    const fileData = await response.arrayBuffer();
    
    // Yanıtı oluştur ve başlıkları ayarla
    const nextResponse = new NextResponse(fileData, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": contentDisposition,
        "Content-Length": contentLength || String(fileData.byteLength)
      }
    });

    console.log(`[files:download:get:${requestId}] İndirme başarılı, dosya boyutu:`, fileData.byteLength);
    return nextResponse;
    
  } catch (error) {
    console.error(`[files:download:get:${requestId}] İndirme hatası:`, error);
    logError("[files:download:get] unhandled", { message: String(error?.message || error) });
    return new Response(`Sunucu hatası: ${error.message}`, { status: 500 });
  }
}
