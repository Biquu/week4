import { getSessionTicketFromRequest } from "@/lib/session-store";
import { klasorOlustur, klasorGuncelle, klasorTasi, klasorSil } from "@/services/divvydrive/folders";

function json(body, status = 200) {
    return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
}

export async function POST(request) {
    const ticketId = getSessionTicketFromRequest(request);
    if (!ticketId) return json({ Sonuc: false, Mesaj: "Yetkisiz" }, 401);
    const body = await request.json();
    const res = await klasorOlustur({ ticketId, klasorYolu: body?.klasorYolu ?? "", klasorAdi: body?.klasorAdi });
    return json({ Sonuc: Boolean(res.ok) }, res.ok ? 200 : 502);
}

export async function PUT(request) {
    const ticketId = getSessionTicketFromRequest(request);
    if (!ticketId) return json({ Sonuc: false, Mesaj: "Yetkisiz" }, 401);
    const body = await request.json();
    const action = body?.action;
    if (action === "rename") {
        const r = await klasorGuncelle({ ticketId, klasorYolu: body?.klasorYolu ?? "", klasorAdi: body?.klasorAdi, yeniKlasorAdi: body?.yeniKlasorAdi });
        return json({ Sonuc: Boolean(r.ok) }, r.ok ? 200 : 502);
    }
    if (action === "move") {
        const r = await klasorTasi({ ticketId, klasorYolu: body?.klasorYolu ?? "", klasorAdi: body?.klasorAdi, yeniKlasorYolu: body?.yeniKlasorYolu ?? "" });
        return json({ Sonuc: Boolean(r.ok) }, r.ok ? 200 : 502);
    }
    return json({ Sonuc: false, Mesaj: "Geçersiz işlem" }, 400);
}

export async function DELETE(request) {
    const ticketId = getSessionTicketFromRequest(request);
    if (!ticketId) return json({ Sonuc: false, Mesaj: "Yetkisiz" }, 401);
    const body = await request.json();
    const res = await klasorSil({ ticketId, klasorYolu: body?.klasorYolu ?? "", klasorAdi: body?.klasorAdi });
    return json({ Sonuc: Boolean(res.ok) }, res.ok ? 200 : 502);
}


