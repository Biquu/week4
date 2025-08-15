import { fetchJson } from "@/lib/http/client";
import { z } from "zod";

const TicketSchema = z.object({
	KullaniciAdi: z.string().optional(),
	ID: z.string().uuid().optional(),
	Sonuc: z.boolean().optional(),
	Mesaj: z.string().optional(),
});

export async function ticketAl({ KullaniciAdi, Sifre }) {
	const result = await fetchJson("/TicketAl", {
		method: "POST",
		withBasicAuth: true,
		body: { KullaniciAdi, Sifre },
	});
	const parsed = TicketSchema.safeParse(result.data);
	if (!parsed.success) {
		return { ok: false, status: result.status, data: null };
	}
	return { ok: result.ok && Boolean(parsed.data?.Sonuc) && Boolean(parsed.data?.ID), status: result.status, data: parsed.data };
}


