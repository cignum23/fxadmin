import { type NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase/middleware";

// Server-side auth gate for /dashboard and the internal rate-setting API,
// replacing the previous client-only `useEffect` redirect (which shipped
// protected HTML/JS before checking auth) and the leaked static API key.
export async function proxy(request: NextRequest) {
  const { response, user } = await getSessionUser(request);
  const { pathname } = request.nextUrl;

  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isInternalApiRoute = pathname.startsWith("/api/fx/internal");

  if (!user && isDashboardRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!user && isInternalApiRoute) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/fx/internal/:path*"],
};
