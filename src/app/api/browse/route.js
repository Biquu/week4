import { getSessionTicketFromRequest } from "@/lib/session-store";
import { klasorListesiGetir, dosyaListesiGetir } from "@/services/divvydrive/browse";
import { generateRequestId, logInfo, logError } from "@/lib/safe-logger";
import { getSessionIdFromRequest, getStoreSize } from "@/lib/session-store";

export async function GET(request) {
	const requestId = generateRequestId();
	try {
		// Check if user is authenticated
		const ticketId = getSessionTicketFromRequest(request);
		if (!ticketId) {
			const sid = getSessionIdFromRequest(request);
			logError(`[browse] (${requestId}) unauthorized`, { reason: "missing-or-expired-session", sid, storeSize: getStoreSize() });
			return new Response(JSON.stringify({ Sonuc: false, Mesaj: "Yetkisiz (oturum bulunamadı veya süresi doldu)" }), 
				{ status: 401, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
		}
		
		// Get path parameter
		const { searchParams } = new URL(request.url);
		const klasorYolu = searchParams.get("klasorYolu");
		logInfo(`[browse] (${requestId}) list`, { klasorYolu: klasorYolu ?? "<root>" });
		
		// Fetch folders and files
		let klasorler, dosyalar;
		
		try {
			[klasorler, dosyalar] = await Promise.all([
				klasorListesiGetir({ ticketId, klasorYolu }),
				dosyaListesiGetir({ ticketId, klasorYolu }),
			]);
		} catch (error) {
			logError(`[browse] (${requestId}) fetch error`, { message: String(error?.message || error) });
			return new Response(JSON.stringify({ Sonuc: false, Mesaj: "Veri alınırken hata oluştu" }), 
				{ status: 500, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
		}
		
		// Log responses for debugging
		console.log("[browse] Response details:", { 
			klasorStatus: klasorler.status,
			klasorOk: klasorler.ok,
			klasorMesaj: klasorler.data?.Mesaj,
			dosyaStatus: dosyalar.status, 
			dosyaOk: dosyalar.ok,
			dosyaMesaj: dosyalar.data?.Mesaj
		});
		
		// Check if the response indicates an empty folder (which is not an error)
		const isEmptyFolder = 
			(klasorler.status === 200 && klasorler.data?.Mesaj === 'Klasör içi boş') || 
			klasorler.data?.SonucKlasorListe?.length === 0;
			
		const isDosyaSuccess = 
			dosyalar.status === 200 || 
			(dosyalar.status === 200 && dosyalar.data?.Mesaj === 'Klasör Boş') ||
			(dosyalar.status === 200 && dosyalar.data?.Mesaj === 'Dosyalar başarıyla getirildi');
			
		// Real error cases
		if ((klasorler.status !== 200 && !isEmptyFolder) || (dosyalar.status !== 200 && !isDosyaSuccess)) {
			const errorDetails = {
				klasorMesaj: klasorler.data?.Mesaj,
				dosyaMesaj: dosyalar.data?.Mesaj,
				statusK: klasorler.status,
				statusD: dosyalar.status,
				klasorYolu
			};
			logError(`[browse] (${requestId}) upstream failed`, errorDetails);
			return new Response(JSON.stringify({ 
				Sonuc: false, 
				Mesaj: "Listeleme başarısız", 
				Detay: `Klasör: ${klasorler.data?.Mesaj || 'Bilinmeyen hata'}, Dosya: ${dosyalar.data?.Mesaj || 'Bilinmeyen hata'}`
			}), { status: 502, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
		}
		
		// Return successful response
		return new Response(
			JSON.stringify({
				Sonuc: true,
				Klasorler: klasorler.data?.SonucKlasorListe || [],
				Dosyalar: dosyalar.data?.SonucDosyaListe || [],
				EmptyFolder: isEmptyFolder
			}),
			{ status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }
		);
	} catch (e) {
		logError("[browse] unhandled error", { message: String(e?.message || e) });
		return new Response(JSON.stringify({ Sonuc: false, Mesaj: "Sunucu hatası" }), 
			{ status: 500, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
	}
}


