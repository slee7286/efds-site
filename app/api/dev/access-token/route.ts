import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Development-only helper for local CLI work that needs the user's Supabase
 * access token. This route must never be available in a production build.
 */
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse(null, { status: 404 });
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session?.access_token) {
    return NextResponse.json(
      { error: "No authenticated development session" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    { access_token: data.session.access_token },
    { headers: { "Cache-Control": "no-store" } },
  );
}
