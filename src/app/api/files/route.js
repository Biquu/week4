import { getSessionTicketFromRequest } from "@/lib/session-store";
import { generateRequestId, logInfo, logError } from "@/lib/safe-logger";
import { dosyaOlustur, dosyaGuncelle, dosyaTasi, dosyaSil } from "@/services/divvydrive/files";

export async function POST(request) {
	const requestId = generateRequestId();
	try {
		const ticketId = getSessionTicketFromRequest(request);
		if (!ticketId) return new Response(JSON.stringify({ Sonuc: false, Mesaj: "Yetkisiz" }), { status: 401, headers: { "Content-Type": "application/json" } });
		const body = await request.json();
		logInfo(`[files:create] (${requestId})`, { klasorYolu: body?.klasorYolu || "" });
		const res = await dosyaOlustur({ ticketId, klasorYolu: body?.klasorYolu ?? "", dosyaAdi: body?.dosyaAdi });
		return new Response(JSON.stringify({ Sonuc: Boolean(res.ok) }), { status: res.ok ? 200 : 502, headers: { "Content-Type": "application/json" } });
	} catch (e) {
		logError("[files:create] unhandled", { message: String(e?.message || e) });
		return new Response(JSON.stringify({ Sonuc: false }), { status: 500, headers: { "Content-Type": "application/json" } });
	}
}

export async function PUT(request) {
	const requestId = generateRequestId();
	try {
		const ticketId = getSessionTicketFromRequest(request);
		if (!ticketId) return new Response(JSON.stringify({ Sonuc: false, Mesaj: "Yetkisiz" }), { status: 401, headers: { "Content-Type": "application/json" } });
		const body = await request.json();
		const action = body?.action;
		if (action === "rename") {
			const r = await dosyaGuncelle({ ticketId, klasorYolu: body?.klasorYolu ?? "", dosyaAdi: body?.dosyaAdi, yeniDosyaAdi: body?.yeniDosyaAdi });
			return new Response(JSON.stringify({ Sonuc: Boolean(r.ok) }), { status: r.ok ? 200 : 502, headers: { "Content-Type": "application/json" } });
		}
		if (action === "move") {
			const r = await dosyaTasi({ ticketId, klasorYolu: body?.klasorYolu ?? "", dosyaAdi: body?.dosyaAdi, yeniDosyaYolu: body?.yeniDosyaYolu ?? "" });
			return new Response(JSON.stringify({ Sonuc: Boolean(r.ok) }), { status: r.ok ? 200 : 502, headers: { "Content-Type": "application/json" } });
		}
		return new Response(JSON.stringify({ Sonuc: false, Mesaj: "Geçersiz işlem" }), { status: 400, headers: { "Content-Type": "application/json" } });
	} catch (e) {
		logError("[files:update] unhandled", { message: String(e?.message || e) });
		return new Response(JSON.stringify({ Sonuc: false }), { status: 500, headers: { "Content-Type": "application/json" } });
	}
}

export async function DELETE(request) {
	const requestId = generateRequestId();
	try {
		const ticketId = getSessionTicketFromRequest(request);
		if (!ticketId) return new Response(JSON.stringify({ Sonuc: false, Mesaj: "Yetkisiz" }), { status: 401, headers: { "Content-Type": "application/json" } });
		const body = await request.json();
		logInfo(`[files:delete] (${requestId})`, { klasorYolu: body?.klasorYolu || "" });
		const res = await dosyaSil({ ticketId, klasorYolu: body?.klasorYolu ?? "", dosyaAdi: body?.dosyaAdi });
		return new Response(JSON.stringify({ Sonuc: Boolean(res.ok) }), { status: res.ok ? 200 : 502, headers: { "Content-Type": "application/json" } });
	} catch (e) {
		logError("[files:delete] unhandled", { message: String(e?.message || e) });
		return new Response(JSON.stringify({ Sonuc: false }), { status: 500, headers: { "Content-Type": "application/json" } });
	}
}


