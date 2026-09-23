import { getAuthUser, evaluateUserAccess } from "@/lib/auth/server";
import { PROFILE_PHOTO_BUCKET } from "@/lib/auth/profile-photo";
import { isSupabaseConfigured } from "@/lib/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  if (!isSupabaseConfigured) return new Response(null, { status: 404 });
  const supabase = await createServerSupabaseClient();
  const user = await getAuthUser(supabase);
  const { allowed, profile } = await evaluateUserAccess(user, supabase);
  if (!allowed || !profile?.avatarPath) return new Response(null, { status: 404 });

  const { data, error } = await supabase.storage.from(PROFILE_PHOTO_BUCKET).download(profile.avatarPath);
  if (error || !data) return new Response(null, { status: 404 });
  return new Response(data, {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "private, max-age=300",
      "X-Content-Type-Options": "nosniff",
      "Vary": "Cookie",
    },
  });
}
