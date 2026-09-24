// @vitest-environment jsdom

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const updateUser = vi.fn();
vi.mock("@/lib/supabase/client", () => ({
  createBrowserSupabaseClient: () => ({ auth: { updateUser } }),
}));

import { PasswordForm } from "../components/auth/password-form";

function enterNewPassword() {
  fireEvent.change(screen.getByLabelText("New password"), { target: { value: "a-new-password-123" } });
  fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: "a-new-password-123" } });
  fireEvent.click(screen.getByRole("button", { name: "Update password" }));
}

function authorization(ok: boolean, message = "Access could not be verified") {
  return { ok, json: async () => ok ? { redirect: "/dashboard" } : { message } };
}

describe("password reset feedback", () => {
  beforeEach(() => updateUser.mockReset());
  afterEach(() => vi.unstubAllGlobals());

  it("does not try to change the password if EFDS access verification fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(authorization(false)));
    render(<PasswordForm mode="reset" />);
    enterNewPassword();
    expect(await screen.findByRole("alert")).toHaveProperty("textContent", "We could not verify your EFDS access: Access could not be verified");
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("says clearly when Supabase rejects the password change", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(authorization(true)));
    updateUser.mockResolvedValue({ error: { message: "Choose a different password" } });
    render(<PasswordForm mode="reset" />);
    enterNewPassword();
    expect(await screen.findByRole("alert")).toHaveProperty("textContent", "Your password was not changed: Choose a different password");
  });

  it("does not claim the password failed when only the workspace check fails afterward", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(authorization(true))
      .mockResolvedValueOnce(authorization(false)));
    updateUser.mockResolvedValue({ error: null });
    render(<PasswordForm mode="reset" />);
    enterNewPassword();
    expect(await screen.findByRole("status")).toHaveProperty("textContent", "Your password was updated, but we could not open the workspace. Sign in with your new password.");
    expect(screen.getByRole("link", { name: "Sign in with your new password" }).getAttribute("href")).toBe("/login");
    expect(screen.getByRole("button", { name: "Update password" }).hasAttribute("disabled")).toBe(true);
    expect(updateUser).toHaveBeenCalledTimes(1);
  });
});
