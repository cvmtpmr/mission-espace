import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/sitemap.xml")
  ) {
    return NextResponse.next();
  }

  const { supabase, res } = createSupabaseMiddlewareClient(req);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return res;

  if (pathname.startsWith("/setup")) return res;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) return res;

  if (!profile) {
    return NextResponse.redirect(new URL("/setup", req.url));
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};

