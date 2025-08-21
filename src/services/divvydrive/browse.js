import { fetchGet } from "@/lib/http/client";

function toBrowseResponse(raw) {
	const isObj = raw && typeof raw === "object";
	
	// Handle "Klasör içi boş" case which might come as a string from API
	if (typeof raw === "string" && raw.includes("Klasör içi boş")) {
		return { Sonuc: true, SonucKlasorListe: [], SonucDosyaListe: [], Mesaj: "Klasör içi boş" };
	}
	
	// Default case for object responses
	const Sonuc = Boolean(isObj && (raw.Sonuc || raw.Mesaj === "Klasör içi boş" || raw.Mesaj === "Dosyalar başarıyla getirildi"));
	const SonucKlasorListe = (isObj && Array.isArray(raw.SonucKlasorListe)) ? raw.SonucKlasorListe : [];
	const SonucDosyaListe = (isObj && Array.isArray(raw.SonucDosyaListe)) ? raw.SonucDosyaListe : [];
	
	return { 
		Sonuc, 
		SonucKlasorListe, 
		SonucDosyaListe, 
		Mesaj: isObj ? raw.Mesaj : undefined 
	};
}

export async function klasorListesiGetir({ ticketId, klasorYolu = null }) {
	const params = { ticketId: ticketId, klasorYolu: klasorYolu ?? "" };
	try {
		const res = await fetchGet("/KlasorListesiGetir", params, { withBasicAuth: true });
		
		// Debug logging
		console.log("[klasorListesiGetir] Raw response:", res);
		
		// Handle empty folder messages as success
		if (res.status === 200) {
			if (typeof res.data === "string" && res.data.includes("Klasör içi boş")) {
				return { 
					ok: true, 
					status: 200, 
					data: { 
						Sonuc: true, 
						Mesaj: "Klasör içi boş", 
						SonucKlasorListe: [] 
					} 
				};
			}
			
			// Process normal object response
			const data = toBrowseResponse(res.data);
			
			// Special case: API returns Mesaj="Klasör içi boş" but we want to treat it as success
			if (data.Mesaj === "Klasör içi boş") {
				return { ok: true, status: 200, data: { ...data, Sonuc: true } };
			}
			
			return { ok: res.ok, status: res.status, data };
		}
		
		const data = toBrowseResponse(res.data);
		return { ok: res.ok && data.Sonuc, status: res.status, data };
	} catch (error) {
		console.error("[klasorListesiGetir] Error:", error);
		return { ok: false, status: 500, data: { Sonuc: false, Mesaj: "Klasör listesi alınamadı" } };
	}
}

export async function dosyaListesiGetir({ ticketId, klasorYolu = null }) {
	const params = { ticketId: ticketId, klasorYolu: klasorYolu ?? "" };
	try {
		const res = await fetchGet("/DosyaListesiGetir", params, { withBasicAuth: true });
		
		// Debug logging
		console.log("[dosyaListesiGetir] Raw response:", res);
		
		// Success case handling
		if (res.status === 200) {
			if (typeof res.data === "string" && (
				res.data.includes("Dosyalar başarıyla getirildi") || 
				res.data.includes("Klasör Boş")
			)) {
				return { 
					ok: true, 
					status: 200, 
					data: { 
						Sonuc: true, 
						Mesaj: res.data,
						SonucDosyaListe: [] 
					} 
				};
			}
			
			// Process normal object response
			const data = toBrowseResponse(res.data);
			
			// Special case handling for specific success messages
			if (data.Mesaj === "Dosyalar başarıyla getirildi" || data.Mesaj === "Klasör Boş") {
				return { ok: true, status: 200, data };
			}
			
			return { ok: res.ok, status: res.status, data };
		}
		
		const data = toBrowseResponse(res.data);
		return { ok: res.ok && data.Sonuc, status: res.status, data };
	} catch (error) {
		console.error("[dosyaListesiGetir] Error:", error);
		return { ok: false, status: 500, data: { Sonuc: false, Mesaj: "Dosya listesi alınamadı" } };
	}
}


