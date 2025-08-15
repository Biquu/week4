/**
 * Lightweight logger utilities for both server and client.
 * Ensures sensitive values are never printed.
 */

export function generateRequestId() {
	const rand = Math.random().toString(36).slice(2, 10);
	const time = Date.now().toString(36).slice(-6);
	return `${rand}-${time}`;
}

export function redactShallow(input) {
	if (!input || typeof input !== "object") return input;
	const sensitiveKeys = new Set([
		"Sifre",
		"password",
		"pass",
		"API_AUTH_PASS",
		"API_AUTH_USER",
		"ID",
		"ticketId",
		"ticketID",
	]);
	const output = {};
	for (const [key, value] of Object.entries(input)) {
		output[key] = sensitiveKeys.has(key) ? "[REDACTED]" : value;
	}
	return output;
}

export function logInfo(label, details) {
	try {
		if (details === undefined) {
			console.info(`[INFO] ${label}`);
		} else {
			console.info(`[INFO] ${label}:`, details);
		}
	} catch {}
}

export function logWarn(label, details) {
	try {
		if (details === undefined) {
			console.warn(`[WARN] ${label}`);
		} else {
			console.warn(`[WARN] ${label}:`, details);
		}
	} catch {}
}

export function logError(label, details) {
	try {
		if (details === undefined) {
			console.error(`[ERROR] ${label}`);
		} else {
			console.error(`[ERROR] ${label}:`, details);
		}
	} catch {}
}


