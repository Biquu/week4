import { fetchJson } from "@/lib/http/client";
import { z } from "zod";
import { fileToMd5 } from "@/utils/md5";

// API Sonuç şemaları
const Result = z.object({ Mesaj: z.string().optional(), Sonuc: z.boolean() });
const FileResult = z.object({ 
  Mesaj: z.string().optional(), 
  Sonuc: z.boolean(),
  SonucDosyaListe: z.array(z.object({
    ID: z.number(),
    Adi: z.string(),
    Boyut: z.number()
  })).optional(),
  SonucKlasorListe: z.array(z.object({
    ID: z.number(),
    Adi: z.string()
  })).optional()
});

export async function dosyaOlustur({ ticketId, klasorYolu = null, dosyaAdi }) {
	const res = await fetchJson("/DosyaOlustur", {
		method: "POST",
		withBasicAuth: true,
		body: { ticketId, klasorYolu: klasorYolu ?? "", dosyaAdi },
	});
	const parsed = Result.safeParse(res.data);
	return { ok: res.ok && parsed.success && parsed.data.Sonuc, status: res.status, data: parsed.success ? parsed.data : null };
}

export async function dosyaGuncelle({ ticketId, klasorYolu = null, dosyaAdi, yeniDosyaAdi }) {
	const res = await fetchJson("/DosyaGuncelle", {
		method: "PUT",
		withBasicAuth: true,
		body: { ticketId, klasorYolu: klasorYolu ?? "", dosyaAdi, yeniDosyaAdi },
	});
	const parsed = Result.safeParse(res.data);
	return { ok: res.ok && parsed.success && parsed.data.Sonuc, status: res.status, data: parsed.success ? parsed.data : null };
}

export async function dosyaTasi({ ticketId, klasorYolu = null, dosyaAdi, yeniDosyaYolu = "" }) {
	const res = await fetchJson("/DosyaTasi", {
		method: "PUT",
		withBasicAuth: true,
		body: { ticketId, klasorYolu: klasorYolu ?? "", dosyaAdi, yeniDosyaYolu },
	});
	const parsed = Result.safeParse(res.data);
	return { ok: res.ok && parsed.success && parsed.data.Sonuc, status: res.status, data: parsed.success ? parsed.data : null };
}

export async function dosyaSil({ ticketId, klasorYolu = null, dosyaAdi }) {
	const res = await fetchJson("/DosyaSil", {
		method: "DELETE",
		withBasicAuth: true,
		body: { ticketId, klasorYolu: klasorYolu ?? "", dosyaAdi },
	});
	const parsed = Result.safeParse(res.data);
	return { ok: res.ok && parsed.success && parsed.data.Sonuc, status: res.status, data: parsed.success ? parsed.data : null };
}

/**
 * Dosya indirme - Belirtilen dosyayı indirir
 */
export async function dosyaIndir({ ticketId, klasorYolu = null, dosyaAdi }) {
	try {
		console.log("[dosyaIndir] İstek gönderiliyor:", { 
			ticketId, 
			klasorYolu: klasorYolu ?? "", 
			dosyaAdi 
		});
		
		const res = await fetchJson("/DosyaIndir", {
			method: "POST",
			withBasicAuth: true,
			body: { ticketId, klasorYolu: klasorYolu ?? "", dosyaAdi, indirilecekYol: "" },
		});
		
		console.log("[dosyaIndir] API yanıtı:", { 
			ok: res.ok, 
			status: res.status, 
			data: res.data 
		});
		
		// Ortam değişkeninden API URL'sini al veya varsayılan değeri kullan
		const baseUrl = process.env.API_BASE_URL || "https://test.divvydrive.com/Test/Staj";
		
		// İndirme URL'sini oluştur - doğrudan API'ye değil, bizim kendi API'mize yönlendir
		const downloadUrl = res.ok ? `/api/files/download/get?ticketID=${ticketId}&klasorYolu=${encodeURIComponent(klasorYolu ?? "")}&dosyaAdi=${encodeURIComponent(dosyaAdi)}` : null;
		
		console.log("[dosyaIndir] Oluşturulan indirme URL'si:", downloadUrl);
		
		return { 
			ok: res.ok, 
			status: res.status, 
			data: res.data,
			url: downloadUrl
		};
	} catch (error) {
		console.error("[dosyaIndir] Hata:", error);
		return { ok: false, status: 500, data: null, error };
	}
}

/**
 * Doğrudan dosya yükleme (küçük dosyalar için) - binary olarak
 */
export async function dosyaDirektYukle({ ticketId, dosyaAdi, klasorYolu = null, file }) {
	console.log("[DosyaDirektYukle] Başlatılıyor:", { 
		dosyaAdi, 
		klasorYolu, 
		boyut: file.size, 
		tip: file.type 
	});
	
	try {
		// Dosya hash'ini hesapla (MD5 benzeri)
		const dosyaHash = await createSimpleHash(file);
		console.log("[DosyaDirektYukle] Hash hesaplandı:", dosyaHash);
		
		// Dosya içeriğini binary olarak al
		const fileBuffer = await file.arrayBuffer();
		console.log("[DosyaDirektYukle] Dosya buffer'a çevrildi, boyut:", fileBuffer.byteLength);
		
		// API'ye dosya yükleme isteği gönder - Binary olarak
		// Ortam değişkeninden API URL'sini al veya varsayılan değeri kullan
		const baseUrl = process.env.API_BASE_URL || "https://test.divvydrive.com/Test/Staj";
		const url = `${baseUrl}/DosyaDirektYukle?ticketID=${ticketId}&dosyaAdi=${encodeURIComponent(dosyaAdi)}&klasorYolu=${encodeURIComponent(klasorYolu ?? "")}&dosyaHash=${dosyaHash}`;
		
		console.log("[DosyaDirektYukle] İstek URL:", url);
		console.log("[DosyaDirektYukle] İstek başlatılıyor...");
		
		const res = await fetch(url, {
			method: "POST",
			headers: {
				"Authorization": `Basic ${btoa(process.env.API_AUTH_USER + ":" + process.env.API_AUTH_PASS || "NDSServis:ca5094ef-eae0-4bd5-a94a-14db3b8f3950")}`,
				"Content-Type": "application/octet-stream" // Binary veri formatı
			},
			body: fileBuffer // Doğrudan binary buffer kullan
		});
		
		console.log("[DosyaDirektYukle] Yanıt alındı:", { status: res.status, ok: res.ok });
		
		// Yanıt içeriğini önce text olarak al ve içeriği kontrol et
		const responseText = await res.text();
		console.log("[DosyaDirektYukle] Yanıt metni:", responseText.substring(0, 200) + (responseText.length > 200 ? "..." : ""));
		
		// Yanıt metin olarak JSON mu kontrol et
		let data;
		try {
			// JSON parse etmeyi dene
			data = JSON.parse(responseText);
			console.log("[DosyaDirektYukle] JSON yanıt:", data);
		} catch (parseError) {
			console.error("[DosyaDirektYukle] JSON parse hatası:", parseError);
			console.error("[DosyaDirektYukle] Yanıt metni (ilk 500 karakter):", responseText.substring(0, 500));
			
			// HTML yanıtı olabilir, başarısız kabul et
			return { 
				ok: false, 
				status: res.status, 
				data: null, 
				error: "API yanıtı JSON değil, muhtemelen HTML hata sayfası döndü.",
				responseText: responseText.substring(0, 500)
			};
		}
		
		return { ok: res.ok, status: res.status, data };
	} catch (error) {
		console.error("[DosyaDirektYukle] Hata:", error);
		return { ok: false, status: 500, data: null, error };
	}
}

/**
 * Parçalı dosya yükleme - Adım 1: Metadata kaydı oluştur
 */
export async function dosyaMetaDataKaydiOlustur({ ticketId, dosyaAdi, parcaSayisi, herBirParcaninBoyutuByte }) {
	console.log("[DosyaMetaData] Başlatılıyor:", {
		dosyaAdi,
		parcaSayisi,
		herBirParcaninBoyutuByte,
		toplamBoyut: parcaSayisi * herBirParcaninBoyutuByte
	});
	
	try {
		const res = await fetchJson("/DosyaMetaDataKaydiOlustur", {
			method: "POST",
			withBasicAuth: true,
			body: { 
				ticketID: ticketId, 
				dosyaAdi, 
				parcaSayisi, 
				herBirParcaninBoyutuByte 
			},
		});
		
		console.log("[DosyaMetaData] Yanıt:", {
			status: res.status,
			ok: res.ok,
			data: res.data
		});
		
		return { ok: res.ok, status: res.status, data: res.data };
	} catch (error) {
		console.error("[DosyaMetaData] Hata:", error);
		return { ok: false, status: 500, data: null, error };
	}
}

/**
 * Parçalı dosya yükleme - Adım 2: Dosya parçalarını binary olarak yükle
 */
export async function dosyaParcalariYukle({ ticketId, tempKlasorID, parcaNumarasi, parcaHash, fileChunk }) {
	console.log(`[DosyaParca:${parcaNumarasi}] Yükleme başlatılıyor:`, {
		tempKlasorID,
		parcaNumarasi,
		parcaHash,
		chunkSize: fileChunk.size
	});
	
	try {
		// Dosya parçasının binary içeriğini al
		const chunkBuffer = await fileChunk.arrayBuffer();
		console.log(`[DosyaParca:${parcaNumarasi}] Buffer'a çevrildi, boyut:`, chunkBuffer.byteLength);
		
		// API'ye dosya parçası yükleme isteği gönder
		// Ortam değişkeninden API URL'sini al veya varsayılan değeri kullan
		const baseUrl = process.env.API_BASE_URL || "https://test.divvydrive.com/Test/Staj";
		const url = `${baseUrl}/DosyaParcalariYukle?ticketID=${ticketId}&tempKlasorID=${tempKlasorID}&parcaNumarasi=${parcaNumarasi}&parcaHash=${parcaHash}`;
		console.log(`[DosyaParca:${parcaNumarasi}] İstek URL:`, url);
		
		const res = await fetch(url, {
			method: "POST",
			headers: {
				"Authorization": `Basic ${btoa(process.env.API_AUTH_USER + ":" + process.env.API_AUTH_PASS || "NDSServis:ca5094ef-eae0-4bd5-a94a-14db3b8f3950")}`,
				"Content-Type": "application/octet-stream" // Binary veri formatı
			},
			body: chunkBuffer // Doğrudan binary buffer kullan
		});
		
		console.log(`[DosyaParca:${parcaNumarasi}] Yanıt alındı:`, { status: res.status, ok: res.ok });
		
		// Yanıt içeriğini önce text olarak al ve içeriği kontrol et
		const responseText = await res.text();
		console.log(`[DosyaParca:${parcaNumarasi}] Yanıt metni:`, 
			responseText.substring(0, 100) + (responseText.length > 100 ? "..." : ""));
		
		// Yanıt metin olarak JSON mu kontrol et
		let data;
		try {
			// JSON parse etmeyi dene
			data = JSON.parse(responseText);
			console.log(`[DosyaParca:${parcaNumarasi}] JSON yanıt:`, data);
		} catch (parseError) {
			console.error(`[DosyaParca:${parcaNumarasi}] JSON parse hatası:`, parseError);
			console.error(`[DosyaParca:${parcaNumarasi}] Yanıt metni (ilk 300 karakter):`, responseText.substring(0, 300));
			
			// HTML yanıtı olabilir, başarısız kabul et
			return { 
				ok: false, 
				status: res.status, 
				data: null, 
				error: "API yanıtı JSON değil, muhtemelen HTML hata sayfası döndü.",
				responseText: responseText.substring(0, 300)
			};
		}
		
		return { ok: res.ok, status: res.status, data };
	} catch (error) {
		console.error(`[DosyaParca:${parcaNumarasi}] Hata:`, error);
		return { ok: false, status: 500, data: null, error };
	}
}

/**
 * Parçalı dosya yükleme - Adım 3: Dosyayı yayınla
 */
export async function dosyaYayinla({ ticketId, ID, dosyaAdi, klasorYolu = null }) {
	console.log("[DosyaYayinla] Başlatılıyor:", {
		ticketId,
		tempKlasorID: ID,
		dosyaAdi,
		klasorYolu
	});
	
	try {
		const res = await fetchJson("/DosyaYayinla", {
			method: "POST",
			withBasicAuth: true,
			body: { 
				ticketID: ticketId, 
				ID, 
				dosyaAdi, 
				klasorYolu: klasorYolu ?? "" 
			},
		});
		
		console.log("[DosyaYayinla] Yanıt:", {
			status: res.status,
			ok: res.ok,
			data: res.data
		});

		// Yayınlama sonrası dosya boyutunu API yanıtından alamazsak, dosya boyutunu tahmin eden bir değer döndürelim
		if (res.ok && (!res.data?.SonucDosyaListe || res.data.SonucDosyaListe.length === 0)) {
			console.log("[DosyaYayinla] API'den boyut bilgisi dönmedi, tahmini bir değer oluşturulacak");
			
			// API boyut bilgisi döndürmediyse, yapay bir yanıt oluştur
			// Bu, API'de eksik boyut bilgisi için geçici bir çözüm
			const modifiedData = {
				...res.data,
				SonucDosyaListe: [{
					ID: Date.now(),  // Gerçek ID olmasa da geçici bir ID
					Adi: dosyaAdi,
					Boyut: 1024 * 1024 * 5  // Tahmini 5 MB (ya da uygun bir değer)
				}]
			};
			
			return { ok: res.ok, status: res.status, data: modifiedData };
		}
		
		return { ok: res.ok, status: res.status, data: res.data };
	} catch (error) {
		console.error("[DosyaYayinla] Hata:", error);
		return { ok: false, status: 500, data: null, error };
	}
}

// Yardımcı fonksiyonlar
async function createSimpleHash(file) {
	console.log("[Hash] Dosya MD5 hash'i hesaplanıyor:", { fileName: file.name, size: file.size });
	
	try {
		// MD5 hesapla
		const hashHex = await fileToMd5(file);
		console.log("[Hash] MD5 hesaplandı:", hashHex);
		return hashHex;
	} catch (error) {
		console.error("[Hash] MD5 hesaplama hatası:", error);
		throw error;
	}
}



