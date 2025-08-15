export async function POST(request) {
	try {
		const body = await request.json();
		const { KullaniciAdi, Sifre } = body || {};

		if (!KullaniciAdi || !Sifre) {
			return new Response(
				JSON.stringify({ Sonuc: false, Mesaj: "KullaniciAdi ve Sifre zorunludur" }),
				{ status: 400, headers: { "Content-Type": "application/json" } }
			);
		}

		const apiBaseUrl = process.env.API_BASE_URL;
		const apiUser = process.env.API_AUTH_USER;
		const apiPass = process.env.API_AUTH_PASS;

		if (!apiBaseUrl || !apiUser || !apiPass) {
			return new Response(
				JSON.stringify({ Sonuc: false, Mesaj: "Sunucu konfigürasyonu eksik" }),
				{ status: 500, headers: { "Content-Type": "application/json" } }
			);
		}

		const basic = Buffer.from(`${apiUser}:${apiPass}`).toString("base64");
		const targetUrl = `${apiBaseUrl.replace(/\/$/, "")}/TicketAl`;

		const upstream = await fetch(targetUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Basic ${basic}`,
			},
			body: JSON.stringify({ KullaniciAdi, Sifre }),
		});

		// Proxy yanıtını olduğu gibi ilet
		const contentType = upstream.headers.get("content-type") || "application/json";
		const status = upstream.status;
		const text = await upstream.text();
		return new Response(text, { status, headers: { "Content-Type": contentType } });
	} catch (error) {
		return new Response(
			JSON.stringify({ Sonuc: false, Mesaj: "Sunucu hatası", Hata: String(error?.message || error) }),
			{ status: 500, headers: { "Content-Type": "application/json" } }
		);
	}
}


