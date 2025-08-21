import { getSessionTicketFromRequest } from "@/lib/session-store";
import { generateRequestId, logInfo, logError } from "@/lib/safe-logger";
import { dosyaIndir } from "@/services/divvydrive/files";

export async function POST(request) {
	const requestId = generateRequestId();
	try {
		const ticketId = getSessionTicketFromRequest(request);
		if (!ticketId) {
			return new Response(
				JSON.stringify({ Sonuc: false, Mesaj: "Yetkisiz" }), 
				{ status: 401, headers: { "Content-Type": "application/json" } }
			);
		}
		
		const body = await request.json();
		logInfo(`[files:download] (${requestId})`, { 
			klasorYolu: body?.klasorYolu || "",
			dosyaAdi: body?.dosyaAdi
		});
		
		console.log(`[files:download:${requestId}] İndirme isteği gönderiliyor:`, { 
			ticketId, 
			klasorYolu: body?.klasorYolu ?? "", 
			dosyaAdi: body?.dosyaAdi 
		});
		
		const res = await dosyaIndir({ 
			ticketId, 
			klasorYolu: body?.klasorYolu ?? "", 
			dosyaAdi: body?.dosyaAdi 
		});
		
		console.log(`[files:download:${requestId}] İndirme yanıtı:`, { 
			ok: res.ok, 
			status: res.status, 
			url: res.url,
			data: res.data
		});
		
		if (res.ok) {
			console.log(`[files:download:${requestId}] İndirme başarılı, URL:`, res.url);
			return new Response(JSON.stringify({ 
				Sonuc: true, 
				downloadUrl: res.url 
			}), { 
				status: 200, 
				headers: { "Content-Type": "application/json" } 
			});
		} else {
			console.error(`[files:download:${requestId}] İndirme başarısız:`, {
				status: res.status,
				data: res.data,
				error: res.error
			});
			return new Response(JSON.stringify({ 
				Sonuc: false, 
				Mesaj: res.data?.Mesaj || "Dosya indirilemedi"
			}), { 
				status: 502, 
				headers: { "Content-Type": "application/json" } 
			});
		}
	} catch (e) {
		console.error(`[files:download:${requestId}] Beklenmeyen hata:`, e);
		logError("[files:download] unhandled", { message: String(e?.message || e) });
		return new Response(JSON.stringify({ 
			Sonuc: false, 
			Mesaj: "Sunucu hatası" 
		}), { 
			status: 500, 
			headers: { "Content-Type": "application/json" } 
		});
	}
}
