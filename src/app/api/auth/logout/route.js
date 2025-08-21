import { deleteSession } from "@/lib/session-store";

export async function POST(request) {
	try {
		const cookie = request.headers.get("cookie") || "";
		const match = /(?:^|; )dd_sid=([^;]+)/.exec(cookie);
		if (match?.[1]) {
			const sid = decodeURIComponent(match[1]);
			deleteSession(sid);
		}
		const isProd = process.env.NODE_ENV === "production";
		const parts = ["dd_sid=", "Path=/", "HttpOnly", "SameSite=Strict", "Max-Age=0"];
		if (isProd) parts.push("Secure");
		return new Response(null, {
			status: 204,
			headers: { "Set-Cookie": parts.join("; ") },
		});
	} catch (e) {
		return new Response(null, { status: 204 });
	}
}


