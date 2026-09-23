import { beforeEach, describe, expect, it, vi } from "vitest";
import { profileInitials, validateProfilePhoto } from "../lib/auth/profile-photo";

const auth = vi.hoisted(() => ({
  getAuthUser: vi.fn(),
  evaluateUserAccess: vi.fn(),
  download: vi.fn(),
}));

vi.mock("@/lib/config", () => ({ isSupabaseConfigured: true }));
vi.mock("@/lib/auth/server", () => ({ getAuthUser: auth.getAuthUser, evaluateUserAccess: auth.evaluateUserAccess }));
vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({ storage: { from: () => ({ download: auth.download }) } }),
}));

import { GET } from "../app/api/profile/photo/route";

describe("profile photos", () => {
  beforeEach(() => {
    auth.getAuthUser.mockReset();
    auth.evaluateUserAccess.mockReset();
    auth.download.mockReset();
  });

  it("keeps photo downloads behind the member access check", async () => {
    auth.getAuthUser.mockResolvedValue(null);
    auth.evaluateUserAccess.mockResolvedValue({ allowed: false, profile: null });
    const response = await GET();
    expect(response.status).toBe(404);
    expect(auth.download).not.toHaveBeenCalled();
  });

  it("serves only the authenticated profile's saved photo as private content", async () => {
    auth.getAuthUser.mockResolvedValue({ id: "member-id" });
    auth.evaluateUserAccess.mockResolvedValue({ allowed: true, profile: { avatarPath: "member-id/photo.webp" } });
    auth.download.mockResolvedValue({ data: new Blob(["photo"], { type: "image/webp" }), error: null });
    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("private");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(auth.download).toHaveBeenCalledWith("member-id/photo.webp");
  });

  it("accepts only usable photo files and gives names a readable fallback", () => {
    expect(validateProfilePhoto({ type: "image/svg+xml", size: 100 })).toMatch(/JPG, PNG or WebP/);
    expect(validateProfilePhoto({ type: "image/png", size: 5 * 1024 * 1024 + 1 })).toMatch(/smaller than 5 MB/);
    expect(validateProfilePhoto({ type: "image/png", size: 0 })).toMatch(/empty/);
    expect(validateProfilePhoto({ type: "image/jpeg", size: 100 })).toBeNull();
    expect(profileInitials("Siheon Lee", null)).toBe("SL");
    expect(profileInitials(null, "member@imperial.ac.uk")).toBe("ME");
  });
});
