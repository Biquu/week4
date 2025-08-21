// In-memory session store (replace with Redis in production)
// Maps opaque session IDs to DivvyDrive ticket IDs with expiration.
// Persist across dev hot-reloads using a global singleton.
const sessions = (globalThis.__DD_SESSIONS ||= new Map());
const DEFAULT_TTL_MS = 45 * 60 * 1000; // 45 minutes

export function createSession(ticketId, ttlMs = DEFAULT_TTL_MS) {
	const id = globalThis.crypto?.randomUUID
		? globalThis.crypto.randomUUID()
		: `${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
	const expiresAt = Date.now() + ttlMs;
	sessions.set(id, { ticketId, expiresAt });
	return id;
}

export function getTicketBySession(sessionId) {
	const entry = sessions.get(sessionId);
	if (!entry) return null;
	if (entry.expiresAt < Date.now()) {
		sessions.delete(sessionId);
		return null;
	}
	return entry.ticketId;
}

export function deleteSession(sessionId) {
	sessions.delete(sessionId);
}

export function getSessionTicketFromRequest(request) {
	const cookieHeader = request.headers.get("cookie") || "";
	const match = /(?:^|; )dd_sid=([^;]+)/.exec(cookieHeader);
	if (!match?.[1]) return null;
	const sid = decodeURIComponent(match[1]);
	const ticket = getTicketBySession(sid);
	return ticket;
}

export function getSessionIdFromRequest(request) {
	const cookieHeader = request.headers.get("cookie") || "";
	const match = /(?:^|; )dd_sid=([^;]+)/.exec(cookieHeader);
	return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export function getStoreSize() {
	return sessions.size;
}


