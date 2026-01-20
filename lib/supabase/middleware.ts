import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getProfileOrNull } from "./server";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // 1) user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // pages publiques
  const publicRoutes = ["/login"];
  const isPublic = publicRoutes.some((p) => pathname.startsWith(p));

  // 2) non connecté -> /login
  if (!user) {
    if (!isPublic) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return response;
  }

  // 3) profil (✅ fix)
  const profile = await getProfileOrNull(user.id);

  // pas de profil -> /setup (sauf si déjà sur /setup)
  if (!profile && !pathname.startsWith("/setup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/setup";
    return NextResponse.redirect(url);
  }

  // 4) profil existe -> redirections par rôle
  // ⚠️ adapte les champs selon ta table profiles: role/type etc.
  const role = (profile as any)?.role;

  if (role === "parent" && pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/parent";
    return NextResponse.redirect(url);
  }

  if (role === "child" && pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/child";
    return NextResponse.redirect(url);
  }

  return response;
}

// ⚠️ adapte le matcher à ton projet
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
