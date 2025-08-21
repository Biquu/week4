import { fetchGet } from "@/lib/http/client";

/**
 * API yanıtlarını standart bir formatta dönüştürür.
 * Farklı yanıt formatlarını (string, obje) ve boş klasör durumlarını standartlaştırır.
 * @param {any} raw API'den gelen ham yanıt
 * @returns {Object} Standardize edilmiş yanıt objesi
 */
function toBrowseResponse(raw) {
	// String yanıt kontrolü
	if (typeof raw === "string") {
		// Boş klasör durumları
		if (raw.includes("Klasör içi boş") || raw.includes("Klasör Boş")) {
			return { 
				Sonuc: true, 
				SonucKlasorListe: [], 
				SonucDosyaListe: [], 
				Mesaj: "Klasör içi boş" 
			};
		}
		
		// Başarılı dosya listesi yanıtı
		if (raw.includes("Dosyalar başarıyla getirildi")) {
			return { 
				Sonuc: true, 
				SonucKlasorListe: [], 
				SonucDosyaListe: [], 
				Mesaj: "Dosyalar başarıyla getirildi" 
			};
		}
		
		// Diğer string yanıtlar (muhtemelen hata mesajları)
		return { 
			Sonuc: false, 
			SonucKlasorListe: [], 
			SonucDosyaListe: [], 
			Mesaj: raw 
		};
	}
	
	// Obje yanıt kontrolü
	const isObj = raw && typeof raw === "object";
	if (!isObj) {
		return { 
			Sonuc: false, 
			SonucKlasorListe: [], 
			SonucDosyaListe: [], 
			Mesaj: "Geçersiz yanıt formatı" 
		};
	}
	
	// Başarı durumu kontrolü - birçok durumu ele alır
	const isSuccess = Boolean(
		raw.Sonuc === true || 
		raw.Mesaj === "Klasör içi boş" || 
		raw.Mesaj === "Klasör Boş" || 
		raw.Mesaj === "Dosyalar başarıyla getirildi"
	);
	
	// Liste verilerini standardize et
	const SonucKlasorListe = Array.isArray(raw.SonucKlasorListe) ? raw.SonucKlasorListe : [];
	const SonucDosyaListe = Array.isArray(raw.SonucDosyaListe) ? raw.SonucDosyaListe : [];
	
	return { 
		Sonuc: isSuccess, 
		SonucKlasorListe, 
		SonucDosyaListe, 
		Mesaj: raw.Mesaj 
	};
}

/**
 * Klasör listesini getirir ve yanıtı standardize eder
 * @param {Object} params Parametreler
 * @param {string} params.ticketId Ticket ID
 * @param {string|null} params.klasorYolu Klasör yolu
 * @returns {Promise<Object>} API yanıtı
 */
export async function klasorListesiGetir({ ticketId, klasorYolu = null }) {
	const params = { ticketId: ticketId, klasorYolu: klasorYolu ?? "" };
	try {
		const res = await fetchGet("/KlasorListesiGetir", params, { withBasicAuth: true });
		
		// Debug logging
		console.log("[klasorListesiGetir] Raw response:", res);
		
		// Yanıtı standart formata dönüştür
		const data = toBrowseResponse(res.data);
		
		// HTTP 200 yanıtları, içerik ne olursa olsun başarılı olarak kabul edilir
		if (res.status === 200) {
			return { 
				ok: true, 
				status: 200, 
				data: { 
					...data,
					Sonuc: true // Tüm 200 yanıtları başarılı olarak işaretle
				} 
			};
		}
		
		// Diğer durum kodları için başarı durumunu yanıttaki Sonuc alanına göre belirle
		return { ok: res.ok && data.Sonuc, status: res.status, data };
	} catch (error) {
		console.error("[klasorListesiGetir] Error:", error);
		return { 
			ok: false, 
			status: 500, 
			data: { 
				Sonuc: false, 
				Mesaj: `Klasör listesi alınamadı: ${error.message || 'Bilinmeyen hata'}`,
				SonucKlasorListe: [],
				SonucDosyaListe: []
			} 
		};
	}
}

/**
 * Dosya listesini getirir ve yanıtı standardize eder
 * @param {Object} params Parametreler
 * @param {string} params.ticketId Ticket ID
 * @param {string|null} params.klasorYolu Klasör yolu
 * @returns {Promise<Object>} API yanıtı
 */
export async function dosyaListesiGetir({ ticketId, klasorYolu = null }) {
	const params = { ticketId: ticketId, klasorYolu: klasorYolu ?? "" };
	try {
		const res = await fetchGet("/DosyaListesiGetir", params, { withBasicAuth: true });
		
		// Debug logging
		console.log("[dosyaListesiGetir] Raw response:", res);
		
		// Yanıtı standart formata dönüştür
		const data = toBrowseResponse(res.data);
		
		// HTTP 200 yanıtları, içerik ne olursa olsun başarılı olarak kabul edilir
		if (res.status === 200) {
			return { 
				ok: true, 
				status: 200, 
				data: { 
					...data,
					Sonuc: true // Tüm 200 yanıtları başarılı olarak işaretle
				} 
			};
		}
		
		// Diğer durum kodları için başarı durumunu yanıttaki Sonuc alanına göre belirle
		return { ok: res.ok && data.Sonuc, status: res.status, data };
	} catch (error) {
		console.error("[dosyaListesiGetir] Error:", error);
		return { 
			ok: false, 
			status: 500, 
			data: { 
				Sonuc: false, 
				Mesaj: `Dosya listesi alınamadı: ${error.message || 'Bilinmeyen hata'}`,
				SonucKlasorListe: [],
				SonucDosyaListe: []
			} 
		};
	}
}


