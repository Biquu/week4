import { fetchJson } from "@/lib/http/client";

const okResult = (res) => ({ ok: Boolean(res?.ok && res?.data?.Sonuc), status: res?.status, data: res?.data });

export async function klasorOlustur({ ticketId, klasorYolu = "", klasorAdi }) {
    const res = await fetchJson("/KlasorOlustur", {
        method: "POST",
        withBasicAuth: true,
        body: { ticketId, klasorYolu: klasorYolu ?? "", klasorAdi },
    });
    return okResult(res);
}

export async function klasorGuncelle({ ticketId, klasorYolu = "", klasorAdi, yeniKlasorAdi }) {
    const res = await fetchJson("/KlasorGuncelle", {
        method: "PUT",
        withBasicAuth: true,
        body: { ticketId, klasorYolu: klasorYolu ?? "", klasorAdi, yeniKlasorAdi },
    });
    return okResult(res);
}

export async function klasorTasi({ ticketId, klasorYolu = "", klasorAdi, yeniKlasorYolu = "" }) {
    const res = await fetchJson("/KlasorTasi", {
        method: "PUT",
        withBasicAuth: true,
        body: { ticketId, klasorYolu: klasorYolu ?? "", klasorAdi, yeniKlasorYolu },
    });
    return okResult(res);
}

export async function klasorSil({ ticketId, klasorYolu = "", klasorAdi }) {
    const res = await fetchJson("/KlasorSil", {
        method: "DELETE",
        withBasicAuth: true,
        body: { ticketId, klasorYolu: klasorYolu ?? "", klasorAdi },
    });
    return okResult(res);
}


