// @vitest-environment jsdom

import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AccessProfile } from "@/types/domain";

const account = vi.hoisted(() => ({
  getUser: vi.fn(),
  update: vi.fn(),
  upload: vi.fn(),
  remove: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: account.refresh }) }));
vi.mock("@/components/dashboard/profile-avatar", () => ({ ProfileAvatar: () => <span>Avatar</span> }));
vi.mock("@/lib/supabase/client", () => ({
  createBrowserSupabaseClient: () => ({
    auth: { getUser: account.getUser },
    from: () => ({ update: account.update }),
    storage: { from: () => ({ upload: account.upload, remove: account.remove }) },
  }),
}));

import { ProfileEditor } from "../components/dashboard/profile-editor";

const profile: AccessProfile = {
  id: "profile-id",
  authUserId: "00000000-0000-4000-8000-000000000001",
  email: "member@imperial.ac.uk",
  fullName: "EFDS Member",
  avatarPath: "00000000-0000-4000-8000-000000000001/00000000-0000-4000-8000-000000000002.webp",
  accessRole: "member",
  verificationStatus: "pending",
  verificationClaim: null,
  accessVersion: 1,
  memberType: "imperial",
  officerId: null,
  active: true,
  lastLoginAt: null,
};

function successfulUpdate() {
  account.update.mockReturnValue({
    eq: () => ({ select: () => ({ single: async () => ({ data: { id: profile.id }, error: null }) }) }),
  });
}

describe("profile editing", () => {
  beforeEach(() => {
    for (const fn of Object.values(account)) fn.mockReset();
    account.getUser.mockResolvedValue({ data: { user: { id: profile.authUserId } }, error: null });
    account.upload.mockResolvedValue({ error: null });
    account.remove.mockResolvedValue({ error: null });
    successfulUpdate();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("saves the member's display name through their profile and refreshes the workspace", async () => {
    render(<ProfileEditor profile={profile} />);
    fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "  New   Name  " } });
    fireEvent.click(screen.getByRole("button", { name: "Save name" }));
    await screen.findByText("Your display name has been saved.");
    expect(account.update).toHaveBeenCalledWith({ full_name: "New Name" });
    expect(account.refresh).toHaveBeenCalledOnce();
  });

  it("converts a photo to WebP, saves its owner-scoped path, and removes the old file", async () => {
    vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue({ width: 800, height: 600, close: vi.fn() }));
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ drawImage: vi.fn() } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(callback => callback(new Blob(["compressed"], { type: "image/webp" })));

    render(<ProfileEditor profile={profile} />);
    fireEvent.change(screen.getByLabelText("Profile photo"), { target: { files: [new File(["original"], "portrait.png", { type: "image/png" })] } });
    await screen.findByText("Your profile photo has been updated.");

    const path = account.upload.mock.calls[0][0] as string;
    expect(path).toMatch(/^00000000-0000-4000-8000-000000000001\/[0-9a-f-]{36}\.webp$/);
    expect(account.upload.mock.calls[0][1]).toHaveProperty("type", "image/webp");
    expect(account.update).toHaveBeenCalledWith({ avatar_path: path });
    await waitFor(() => expect(account.remove).toHaveBeenCalledWith([profile.avatarPath]));
    expect(account.refresh).toHaveBeenCalledOnce();
  });

  it("rejects an expired session before changing the profile", async () => {
    account.getUser.mockResolvedValue({ data: { user: null }, error: null });
    render(<ProfileEditor profile={profile} />);
    fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "New Name" } });
    fireEvent.click(screen.getByRole("button", { name: "Save name" }));
    await screen.findByRole("alert");
    expect(screen.getByRole("alert").textContent).toContain("session has expired");
    expect(account.update).not.toHaveBeenCalled();
  });
});
