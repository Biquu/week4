import { getSessionTicketFromRequest } from "@/lib/session-store";
import { generateRequestId, logInfo, logError } from "@/lib/safe-logger";
import { dosyaDirektYukle } from "@/services/divvydrive/files";
export { dynamic, dynamicParams, revalidate, runtime } from './config';

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
		
		// multipart/form-data olarak gönderilen dosyayı ve diğer bilgileri al
		const formData = await request.formData();
		const file = formData.get("file");
		const dosyaAdi = formData.get("dosyaAdi") || file.name;
		const klasorYolu = formData.get("klasorYolu") || "";
		
		// Dosya kontrolü
		if (!file) {
			return new Response(
				JSON.stringify({ Sonuc: false, Mesaj: "Dosya bulunamadı" }), 
				{ status: 400, headers: { "Content-Type": "application/json" } }
			);
		}
		
		logInfo(`[files:upload] (${requestId})`, { 
			klasorYolu: klasorYolu || "",
			dosyaAdi,
			fileSize: file.size
		});
		
		// Dosya boyutu kontrolü (1MB altında ise direkt yükleme, üstündeyse chunked upload)
		const sizeLimit = 1 * 1024 * 1024; // 1MB
		console.log(`[API:Upload] Dosya boyutu kontrolü: ${file.size} bytes (Limit: ${sizeLimit} bytes)`);
		
		if (file.size < sizeLimit) { // 1MB
			console.log(`[API:Upload] Direkt yükleme başlatılıyor`);
			
			// Direkt yükleme (küçük dosyalar için)
			const res = await dosyaDirektYukle({ 
				ticketId, 
				dosyaAdi, 
				klasorYolu, 
				file 
			});
			
			// Sonuçları logla
			console.log(`[API:Upload] Direkt yükleme sonucu:`, { 
				ok: res.ok, 
				status: res.status,
				data: res.data,
				error: res.error
			});
			
			if (res.ok) {
				return new Response(JSON.stringify({ 
					Sonuc: true, 
					Mesaj: "Dosya başarıyla yüklendi"
				}), { 
					status: 200, 
					headers: { "Content-Type": "application/json" } 
				});
			} else {
				return new Response(JSON.stringify({ 
					Sonuc: false, 
					Mesaj: "Dosya yüklenemedi",
					Hata: res.data?.Mesaj || res.error,
					ResponseText: res.responseText
				}), { 
					status: 502, 
					headers: { "Content-Type": "application/json" } 
				});
			}
		} else {
			// Parçalı yükleme gerektiğini bildir
			return new Response(JSON.stringify({ 
				Sonuc: false, 
				Mesaj: "Dosya boyutu 1MB'dan büyük, parçalı yükleme gerekli",
				RequiresChunkedUpload: true,
				FileSize: file.size
			}), { 
				status: 413, 
				headers: { "Content-Type": "application/json" } 
			});
		}
	} catch (e) {
		logError("[files:upload] unhandled", { message: String(e?.message || e) });
		return new Response(JSON.stringify({ 
			Sonuc: false, 
			Mesaj: "Sunucu hatası" 
		}), { 
			status: 500, 
			headers: { "Content-Type": "application/json" } 
		});
	}
}
