import { generateRequestId, logInfo, logError, redactShallow } from "@/lib/safe-logger";
import { ticketAl } from "@/services/divvydrive/auth";
import { createSession } from "@/lib/session-store";

// Simple in-memory rate limiting for this route (per IP)
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 10; // 10 requests per minute
const ipBuckets = new Map();

function isRateLimited(ip) {
	const now = Date.now();
	const bucket = ipBuckets.get(ip) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
	if (now > bucket.resetAt) {
		bucket.count = 0;
		bucket.resetAt = now + RATE_LIMIT_WINDOW_MS;
	}
	bucket.count += 1;
	ipBuckets.set(ip, bucket);
	return bucket.count > RATE_LIMIT_MAX;
}

export async function POST(request) {
	try {
		const requestId = generateRequestId();
		logInfo(`[auth/ticket] (${requestId}) request received`);
		const body = await request.json();
		const { KullaniciAdi, Sifre } = body || {};

		// Rate limit (best-effort). Header 'x-forwarded-for' or ip not always present in dev.
		const ip = request.headers.get("x-forwarded-for") || "local";
		if (isRateLimited(ip)) {
			logError(`[auth/ticket] (${requestId}) rate limited`, { ip });
			return new Response(JSON.stringify({ Sonuc: false, Mesaj: "Çok fazla istek. Lütfen sonra tekrar deneyin." }), {
				status: 429,
				headers: { "Content-Type": "application/json" },
			});
		}

		if (!KullaniciAdi || !Sifre) {
			logError(`[auth/ticket] (${requestId}) validation failed`, redactShallow({ KullaniciAdi, Sifre }));
			return new Response(
				JSON.stringify({ Sonuc: false, Mesaj: "KullaniciAdi ve Sifre zorunludur" }),
				{ status: 400, headers: { "Content-Type": "application/json" } }
			);
		}

		const apiBaseUrl = process.env.API_BASE_URL;
		const apiUser = process.env.API_AUTH_USER;
		const apiPass = process.env.API_AUTH_PASS;

		if (!apiBaseUrl || !apiUser || !apiPass) {
			logError(`[auth/ticket] (${requestId}) missing server config`);
			return new Response(
				JSON.stringify({ Sonuc: false, Mesaj: "Sunucu konfigürasyonu eksik" }),
				{ status: 500, headers: { "Content-Type": "application/json" } }
			);
		}

		// Service layer
		const result = await ticketAl({ KullaniciAdi, Sifre });
		logInfo(`[auth/ticket] (${requestId}) upstream responded`, { status: result.status, ok: result.ok });
		if (!result.ok || !result.data?.ID) {
			return new Response(JSON.stringify({ Sonuc: false, Mesaj: result.data?.Mesaj || "Kimlik doğrulama başarısız" }), {
				status: 401,
				headers: { "Content-Type": "application/json" },
			});
		}

		// Create opaque session id mapped to ticket on the server
		const sessionId = createSession(result.data.ID);
		// Set HttpOnly cookie with session id (not ticket)
		const cookie = [
			`dd_sid=${encodeURIComponent(sessionId)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${45 * 60}`,
		];
		return new Response(JSON.stringify({ Sonuc: true }), {
			status: 200,
			headers: { "Content-Type": "application/json", "Set-Cookie": cookie },
		});
	} catch (error) {
		logError("[auth/ticket] unhandled error", { message: String(error?.message || error) });
		return new Response(
			JSON.stringify({ Sonuc: false, Mesaj: "Sunucu hatası", Hata: String(error?.message || error) }),
			{ status: 500, headers: { "Content-Type": "application/json" } }
		);
	}
}


