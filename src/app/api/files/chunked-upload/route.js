import { getSessionTicketFromRequest } from "@/lib/session-store";
import { generateRequestId, logInfo, logError } from "@/lib/safe-logger";
import { dosyaMetaDataKaydiOlustur, dosyaParcalariYukle, dosyaYayinla } from "@/services/divvydrive/files";
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
		
		// İstek türünü belirle (init, chunk, complete)
		const body = await request.json();
		const step = body.step;
		
		if (step === 'init') {
			// Metadata kaydı oluşturma
			console.log(`[API:Chunked:Init] (${requestId}) Başlatılıyor:`, { 
				dosyaAdi: body.dosyaAdi,
				parcaSayisi: body.parcaSayisi,
				totalSize: body.totalSize,
				chunkSize: body.chunkSize
			});
			
			logInfo(`[files:chunked:init] (${requestId})`, { 
				dosyaAdi: body.dosyaAdi,
				parcaSayisi: body.parcaSayisi,
				totalSize: body.totalSize
			});
			
			const res = await dosyaMetaDataKaydiOlustur({
				ticketId,
				dosyaAdi: body.dosyaAdi,
				parcaSayisi: body.parcaSayisi,
				herBirParcaninBoyutuByte: body.chunkSize
			});
			
			console.log(`[API:Chunked:Init] (${requestId}) Sonuç:`, {
				ok: res.ok,
				status: res.status,
				data: res.data
			});
			
			if (res.ok && res.data) {
				// API yanıtında tempKlasorID, Mesaj alanında geliyor
				const tempKlasorID = res.data.ID || res.data.tempKlasorID || res.data.Mesaj;
				console.log(`[API:Chunked:Init] (${requestId}) TempKlasorID alındı:`, tempKlasorID);
				
				if (!tempKlasorID) {
					console.error(`[API:Chunked:Init] (${requestId}) TempKlasorID bulunamadı!`, res.data);
					return new Response(JSON.stringify({ 
						Sonuc: false, 
						Mesaj: "TempKlasorID alınamadı"
					}), { 
						status: 500, 
						headers: { "Content-Type": "application/json" } 
					});
				}
				
				return new Response(JSON.stringify({ 
					Sonuc: true, 
					tempKlasorID: tempKlasorID
				}), { 
					status: 200, 
					headers: { "Content-Type": "application/json" } 
				});
			} else {
				console.error(`[API:Chunked:Init] (${requestId}) Hata:`, {
					status: res.status,
					data: res.data,
					error: res.error
				});
				
				return new Response(JSON.stringify({ 
					Sonuc: false, 
					Mesaj: "Metadata oluşturulamadı",
					Hata: res.data?.Mesaj || res.error
				}), { 
					status: 502, 
					headers: { "Content-Type": "application/json" } 
				});
			}
		} 
		else if (step === 'complete') {
			// Dosyayı yayınlama
			console.log(`[API:Chunked:Complete] (${requestId}) Başlatılıyor:`, { 
				dosyaAdi: body.dosyaAdi,
				klasorYolu: body.klasorYolu,
				tempKlasorID: body.tempKlasorID
			});
			
			logInfo(`[files:chunked:complete] (${requestId})`, { 
				dosyaAdi: body.dosyaAdi,
				klasorYolu: body.klasorYolu,
				tempKlasorID: body.tempKlasorID
			});
			
			const res = await dosyaYayinla({
				ticketId,
				ID: body.tempKlasorID,
				dosyaAdi: body.dosyaAdi,
				klasorYolu: body.klasorYolu
			});
			
			console.log(`[API:Chunked:Complete] (${requestId}) Sonuç:`, {
				ok: res.ok,
				status: res.status,
				data: res.data
			});
			
			if (res.ok) {
				console.log(`[API:Chunked:Complete] (${requestId}) Yayınlama başarılı`);
				
				// Yayınlama başarılı olduğunda, dosya boyutunu API yanıtından alıyoruz
				let dosyaBoyutu = 0;
				if (res.data?.SonucDosyaListe && res.data.SonucDosyaListe.length > 0) {
					dosyaBoyutu = res.data.SonucDosyaListe[0]?.Boyut || 0;
				}
				
				return new Response(JSON.stringify({ 
					Sonuc: true, 
					Mesaj: "Dosya başarıyla yayınlandı",
					DosyaBoyutu: dosyaBoyutu
				}), { 
					status: 200, 
					headers: { "Content-Type": "application/json" } 
				});
			} else {
				console.error(`[API:Chunked:Complete] (${requestId}) Hata:`, {
					status: res.status,
					data: res.data,
					error: res.error
				});
				
				return new Response(JSON.stringify({ 
					Sonuc: false, 
					Mesaj: "Dosya yayınlanamadı",
					Hata: res.data?.Mesaj || res.error
				}), { 
					status: 502, 
					headers: { "Content-Type": "application/json" } 
				});
			}
		} else {
			return new Response(JSON.stringify({ 
				Sonuc: false, 
				Mesaj: "Geçersiz işlem"
			}), { 
				status: 400, 
				headers: { "Content-Type": "application/json" } 
			});
		}
	} catch (e) {
		logError("[files:chunked] unhandled", { message: String(e?.message || e) });
		return new Response(JSON.stringify({ 
			Sonuc: false, 
			Mesaj: "Sunucu hatası" 
		}), { 
			status: 500, 
			headers: { "Content-Type": "application/json" } 
		});
	}
}

// Dosya parçalarını yükleme endpoint'i
export async function PUT(request) {
	const requestId = generateRequestId();
	try {
		const ticketId = getSessionTicketFromRequest(request);
		if (!ticketId) {
			return new Response(
				JSON.stringify({ Sonuc: false, Mesaj: "Yetkisiz" }), 
				{ status: 401, headers: { "Content-Type": "application/json" } }
			);
		}
		
		// URL parametrelerini al
		const { searchParams } = new URL(request.url);
		const tempKlasorID = searchParams.get("tempKlasorID");
		const parcaNumarasi = parseInt(searchParams.get("parcaNumarasi"), 10);
		const parcaHash = searchParams.get("parcaHash");
		
		if (!tempKlasorID || isNaN(parcaNumarasi) || !parcaHash) {
			return new Response(JSON.stringify({ 
				Sonuc: false, 
				Mesaj: "Geçersiz parametreler"
			}), { 
				status: 400, 
				headers: { "Content-Type": "application/json" } 
			});
		}
		
		// Dosya parçasını al
		const fileChunk = await request.blob();
		
		console.log(`[API:Chunked:Chunk] (${requestId}) Parça alındı:`, { 
			tempKlasorID,
			parcaNumarasi,
			parcaSize: fileChunk.size,
			parcaHash
		});
		
		logInfo(`[files:chunked:chunk] (${requestId})`, { 
			tempKlasorID,
			parcaNumarasi,
			parcaSize: fileChunk.size
		});
		
		// Backend'de gerçek MD5 hash hesapla
		const { fileToMd5 } = await import("@/utils/md5");
		const calculatedHash = await fileToMd5(fileChunk);
		console.log(`[API:Chunked:Chunk] (${requestId}) Backend MD5 hash:`, calculatedHash);
		
		// Parçayı yükle - gerçek MD5 hash ile
		const res = await dosyaParcalariYukle({
			ticketId,
			tempKlasorID,
			parcaNumarasi,
			parcaHash: calculatedHash, // Backend'de hesaplanan gerçek MD5
			fileChunk
		});
		
		console.log(`[API:Chunked:Chunk] (${requestId}) Parça yükleme sonucu:`, { 
			parcaNumarasi,
			ok: res.ok, 
			status: res.status,
			data: res.data
		});
		
		if (res.ok) {
			return new Response(JSON.stringify({ 
				Sonuc: true, 
				parcaNumarasi,
				Mesaj: "Parça başarıyla yüklendi"
			}), { 
				status: 200, 
				headers: { "Content-Type": "application/json" } 
			});
		} else {
			console.error(`[API:Chunked:Chunk] (${requestId}) Hata:`, {
				parcaNumarasi,
				status: res.status,
				data: res.data,
				error: res.error
			});
			
			return new Response(JSON.stringify({ 
				Sonuc: false, 
				parcaNumarasi,
				Mesaj: "Parça yüklenemedi",
				Hata: res.data?.Mesaj || res.error
			}), { 
				status: 502, 
				headers: { "Content-Type": "application/json" } 
			});
		}
	} catch (e) {
		logError("[files:chunked:chunk] unhandled", { message: String(e?.message || e) });
		return new Response(JSON.stringify({ 
			Sonuc: false, 
			Mesaj: "Sunucu hatası" 
		}), { 
			status: 500, 
			headers: { "Content-Type": "application/json" } 
		});
	}
}
