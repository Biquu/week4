import { NextResponse } from "next/server";

const PROTECTED_PREFIXES = ["/dashboard"]; // genişletilebilir

export function middleware(request) {
	const { pathname } = request.nextUrl;
	const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
	const isLogin = pathname.startsWith("/login");

	const cookie = request.cookies.get("dd_sid");
	const hasTicket = Boolean(cookie?.value);

	if (isProtected && !hasTicket) {
		const url = request.nextUrl.clone();
		url.pathname = "/login";
		return NextResponse.redirect(url);
	}

	if (isLogin && hasTicket) {
		const url = request.nextUrl.clone();
		url.pathname = "/dashboard";
		return NextResponse.redirect(url);
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/login", "/dashboard/:path*"],
};


