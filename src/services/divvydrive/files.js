import { fetchJson } from "@/lib/http/client";
import { z } from "zod";

const Result = z.object({ Mesaj: z.string().optional(), Sonuc: z.boolean() });

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


