import { deleteSession } from "@/lib/session-store";

export async function POST(request) {
	try {
		const cookie = request.headers.get("cookie") || "";
		const match = /(?:^|; )dd_sid=([^;]+)/.exec(cookie);
		if (match?.[1]) {
			const sid = decodeURIComponent(match[1]);
			deleteSession(sid);
		}
		return new Response(null, {
			status: 204,
			headers: {
				"Set-Cookie": "dd_sid=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0",
			},
		});
	} catch (e) {
		return new Response(null, { status: 204 });
	}
}


