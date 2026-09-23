import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { config as appConfig } from "@/lib/config";
import { EMAIL_FLOW_COOKIE } from "@/lib/auth/email-flow";

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/") {
    const code = request.nextUrl.searchParams.get("code");
    if (code) {
      const flow = request.cookies.get(EMAIL_FLOW_COOKIE)?.value;
      const destination = new URL(flow === "reset" || flow === "setup" ? "/auth/recovery" : "/auth/callback", request.url);
      destination.searchParams.set("code", code);
      if (flow === "reset" || flow === "setup") destination.searchParams.set("flow", flow);
      const redirect = NextResponse.redirect(destination);
      redirect.cookies.delete(EMAIL_FLOW_COOKIE);
      return redirect;
    }
  }
  let response = NextResponse.next({ request });
  if (!appConfig.supabaseUrl || !appConfig.supabaseAnonKey) return response;
  const supabase = createServerClient(appConfig.supabaseUrl, appConfig.supabaseAnonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet, headers) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
      },
    },
  });
  await supabase.auth.getClaims();
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
