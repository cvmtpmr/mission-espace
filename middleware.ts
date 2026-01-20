// middleware.ts (RACINE)

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Ne pas exécuter sur les assets / fichiers statiques
  const { pathname } = req.nextUrl;
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/sitemap.xml")
  ) {
    return res;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return req.cookies.get(name)?.value;
        },
        set(name, value, options) {
          res.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          res.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Pas connecté -> rien
  if (!user) return res;

  // Autoriser /setup même si pas de profil
  if (pathname.startsWith("/setup")) return res;

  // Lire le profil (0 ou 1)
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  // En cas d'erreur DB -> laisser passer (ou tu peux rediriger vers /error)
  if (error) return res;

  // Pas de profil -> onboarding
  if (!profile) {
    return NextResponse.redirect(new URL("/setup", req.url));
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
