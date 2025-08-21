const DEFAULT_TIMEOUT_MS = 10000;

function buildBasicAuthHeader() {
	const user = process.env.API_AUTH_USER;
	const pass = process.env.API_AUTH_PASS;
	if (!user || !pass) return undefined;
	const basic = Buffer.from(`${user}:${pass}`).toString("base64");
	return `Basic ${basic}`;
}

/**
 * JSON API isteği yapar ve yanıtı işler
 * @param {string} path API endpoint yolu
 * @param {Object} options İstek seçenekleri
 * @param {string} options.method HTTP metodu (GET, POST, vs.)
 * @param {Object} options.body İstek gövdesi
 * @param {Object} options.headers Ek HTTP başlıkları
 * @param {number} options.timeoutMs Zaman aşımı süresi (ms)
 * @param {boolean} options.withBasicAuth Basic Auth kullanımı
 * @returns {Promise<Object>} API yanıtı
 */
export async function fetchJson(path, { method = "GET", body, headers = {}, timeoutMs = DEFAULT_TIMEOUT_MS, withBasicAuth = false } = {}) {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), timeoutMs);
	try {
		// Varsayılan API URL'yi al veya boş kullan
		const baseUrl = (process.env.API_BASE_URL || "https://test.divvydrive.com/Test/Staj").replace(/\/$/, "");
		const url = `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
		
		// İstek başlıklarını hazırla
		const finalHeaders = { "Content-Type": "application/json", ...headers };
		
		// Basic Auth ekle
		if (withBasicAuth) {
			if (process.env.API_AUTH_USER && process.env.API_AUTH_PASS) {
				const auth = buildBasicAuthHeader();
				if (auth) finalHeaders["Authorization"] = auth;
			} else {
				// Ortam değişkenleri yoksa, sabit değerleri kullan
				finalHeaders["Authorization"] = `Basic ${Buffer.from("NDSServis:ca5094ef-eae0-4bd5-a94a-14db3b8f3950").toString("base64")}`;
			}
		}
		
		// Her zaman log yap
		console.log(`[fetchJson] ${method} ${url}`, { 
			hasBody: !!body, 
			bodyKeys: body ? Object.keys(body) : [],
			headers: Object.keys(finalHeaders) 
		});
		
		// API isteğini gönder
		const res = await fetch(url, {
			method,
			headers: finalHeaders,
			body: body ? JSON.stringify(body) : undefined,
			signal: controller.signal,
		});
		
		// Yanıtı işle
		const text = await res.text();
		console.log(`[fetchJson] Yanıt alındı: ${url}`, { 
			status: res.status, 
			ok: res.ok,
			contentLength: text.length,
			contentPreview: text.substring(0, 200) + (text.length > 200 ? '...' : '') 
		});
		
		let data;
		try {
			data = text ? JSON.parse(text) : null;
			console.log(`[fetchJson] JSON parse edildi:`, { 
				dataKeys: data ? (typeof data === 'object' ? Object.keys(data) : 'primitive') : 'null'
			});
		} catch (parseError) {
			// JSON parse hatası - ham metin olarak sakla
			data = text;
			console.error(`[fetchJson] JSON parse hatası: ${url}`, { 
				status: res.status, 
				parseError: parseError.message,
				text: text.substring(0, 200) + (text.length > 200 ? '...' : '') 
			});
		}
		
		// Yanıtı döndür
		return { 
			status: res.status, 
			ok: res.ok, 
			headers: res.headers, 
			data,
			url // Gönderilen URL bilgisini de ekleyelim
		};
	} catch (error) {
		// Network veya timeout hatası
		console.error(`[fetchJson] İstek hatası: ${path}`, {
			errorName: error.name,
			errorMessage: error.message,
			stack: error.stack
		});
		
		if (error.name === 'AbortError') {
			return { 
				status: 408, // Request Timeout
				ok: false, 
				headers: new Headers(), 
				data: `İstek zaman aşımına uğradı (${timeoutMs}ms)`,
				error
			};
		}
		
		return { 
			status: 0, 
			ok: false, 
			headers: new Headers(), 
			data: `Ağ hatası: ${error.message || 'Bilinmeyen hata'}`,
			error
		};
	} finally {
		clearTimeout(timeout);
	}
}

/**
 * GET isteği yapar ve yanıtı işler
 * @param {string} path API endpoint yolu
 * @param {Object} params URL parametreleri
 * @param {Object} options İstek seçenekleri
 * @param {Object} options.headers Ek HTTP başlıkları
 * @param {number} options.timeoutMs Zaman aşımı süresi (ms)
 * @param {boolean} options.withBasicAuth Basic Auth kullanımı
 * @returns {Promise<Object>} API yanıtı
 */
export async function fetchGet(path, params = {}, { headers = {}, timeoutMs = DEFAULT_TIMEOUT_MS, withBasicAuth = false } = {}) {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), timeoutMs);
	try {
		// Varsayılan API URL'yi al veya sabit değeri kullan
		const baseUrl = (process.env.API_BASE_URL || "https://test.divvydrive.com/Test/Staj").replace(/\/$/, "");
		
		// URL parametrelerini hazırla
		const usp = new URLSearchParams();
		for (const [k, v] of Object.entries(params)) {
			if (v === undefined || v === null) continue;
			// Kök için klasorYolu boş string olmalı; diğer anahtarlar boş ise gönderme
			if (v === "" && k !== "klasorYolu") continue;
			usp.append(k, String(v));
		}
		
		// URL oluştur
		const url = `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}${usp.toString() ? `?${usp.toString()}` : ""}`;
		
		// İstek başlıklarını hazırla
		const finalHeaders = { ...headers };
		
		// Basic Auth ekle
		if (withBasicAuth) {
			if (process.env.API_AUTH_USER && process.env.API_AUTH_PASS) {
				const user = process.env.API_AUTH_USER;
				const pass = process.env.API_AUTH_PASS;
				const basic = Buffer.from(`${user}:${pass}`).toString("base64");
				finalHeaders["Authorization"] = `Basic ${basic}`;
			} else {
				// Ortam değişkenleri yoksa, sabit değerleri kullan
				finalHeaders["Authorization"] = `Basic ${Buffer.from("NDSServis:ca5094ef-eae0-4bd5-a94a-14db3b8f3950").toString("base64")}`;
			}
		}
		
		// Debug log - sadece geliştirme ortamında
		if (process.env.NODE_ENV !== 'production') {
			console.log(`[fetchGet] GET ${url}`, { 
				params: Object.keys(params), 
				headers: Object.keys(finalHeaders) 
			});
		}
		
		// API isteğini gönder
		const res = await fetch(url, { 
			method: "GET", 
			headers: finalHeaders, 
			signal: controller.signal,
			// GET isteklerinde önbelleğe almayı engelle
			cache: 'no-store' 
		});
		
		// Yanıtı işle
		const text = await res.text();
		let data;
		try {
			data = text ? JSON.parse(text) : null;
		} catch (parseError) {
			// JSON parse hatası - ham metin olarak sakla
			data = text;
			if (process.env.NODE_ENV !== 'production') {
				console.warn(`[fetchGet] JSON parse hatası: ${url}`, { 
					status: res.status, 
					text: text.substring(0, 100) + (text.length > 100 ? '...' : '') 
				});
			}
		}
		
		// Yanıtı döndür
		return { 
			status: res.status, 
			ok: res.ok, 
			headers: res.headers, 
			data,
			url // Gönderilen URL bilgisini de ekleyelim
		};
	} catch (error) {
		// Network veya timeout hatası
		if (error.name === 'AbortError') {
			return { 
				status: 408, // Request Timeout
				ok: false, 
				headers: new Headers(), 
				data: `İstek zaman aşımına uğradı (${timeoutMs}ms)`,
				error
			};
		}
		
		return { 
			status: 0, 
			ok: false, 
			headers: new Headers(), 
			data: `Ağ hatası: ${error.message || 'Bilinmeyen hata'}`,
			error
		};
	} finally {
		clearTimeout(timeout);
	}
}


