const DEFAULT_TIMEOUT_MS = 10000;

function buildBasicAuthHeader() {
	const user = process.env.API_AUTH_USER;
	const pass = process.env.API_AUTH_PASS;
	if (!user || !pass) return undefined;
	const basic = Buffer.from(`${user}:${pass}`).toString("base64");
	return `Basic ${basic}`;
}

export async function fetchJson(path, { method = "GET", body, headers = {}, timeoutMs = DEFAULT_TIMEOUT_MS, withBasicAuth = false } = {}) {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), timeoutMs);
	try {
		const baseUrl = (process.env.API_BASE_URL || "").replace(/\/$/, "");
		const url = `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
		const finalHeaders = { "Content-Type": "application/json", ...headers };
		if (withBasicAuth) {
			const auth = buildBasicAuthHeader();
			if (auth) finalHeaders["Authorization"] = auth;
		}
		const res = await fetch(url, {
			method,
			headers: finalHeaders,
			body: body ? JSON.stringify(body) : undefined,
			signal: controller.signal,
		});
		const text = await res.text();
		let data;
		try {
			data = text ? JSON.parse(text) : null;
		} catch {
			data = text;
		}
		return { status: res.status, ok: res.ok, headers: res.headers, data };
	} finally {
		clearTimeout(timeout);
	}
}


