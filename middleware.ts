import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const session = request.cookies.get("session")?.value;
  const { pathname } = request.nextUrl;

  const publicPaths = ["/", "/login"];
  const isPublicPath = publicPaths.includes(pathname);
  const isAuthApi = pathname.startsWith("/api/auth/");
  const isPublicApi =
    pathname === "/api/stats" || pathname === "/api/categories";

  if (isPublicPath) {
    if (session) {
      try {
        const payload = JSON.parse(
          Buffer.from(session, "base64").toString("utf-8")
        );
        if (payload.exp > Date.now()) {
          return NextResponse.redirect(new URL("/lost-items", request.url));
        }
      } catch {
        // invalid session — let them see the public page
      }
    }
    return NextResponse.next();
  }

  if (isAuthApi || isPublicApi) {
    return NextResponse.next();
  }

  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const payload = JSON.parse(
      Buffer.from(session, "base64").toString("utf-8")
    );

    if (payload.exp < Date.now()) {
      const response = pathname.startsWith("/api/")
        ? NextResponse.json({ error: "Session expired" }, { status: 401 })
        : NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("session");
      return response;
    }

    if (pathname.startsWith("/admin")) {
      if (payload.role !== "admin") {
        if (pathname.startsWith("/api/")) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        return NextResponse.redirect(new URL("/lost-items", request.url));
      }
    }
  } catch {
    const response = pathname.startsWith("/api/")
      ? NextResponse.json({ error: "Invalid session" }, { status: 401 })
      : NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("session");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads/).*)"],
};
