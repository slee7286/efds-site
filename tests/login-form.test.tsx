// @vitest-environment jsdom

import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const signInWithPassword = vi.fn();
vi.mock("@/lib/supabase/client", () => ({
  createBrowserSupabaseClient: () => ({ auth: { signInWithPassword } }),
}));
vi.mock("@/lib/config", () => ({
  config: { siteUrl: "https://www.imperial-efds.com" },
  isSupabaseConfigured: true,
}));
vi.mock("@/lib/auth/email-cooldown", () => ({
  useEmailCooldown: () => ({ active: false, seconds: 0, start: vi.fn() }),
}));

import { LoginForm } from "../components/auth/login-form";

describe("member account entry", () => {
  beforeEach(() => signInWithPassword.mockReset());

  it("starts account creation with an emailed setup link", () => {
    render(<LoginForm initialAction="setup" />);
    expect(screen.getByRole("heading", { name: "Set up your password." })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Email me an account link" })).toBeTruthy();
    expect(screen.queryByLabelText("Password")).toBeNull();
  });

  it("updates the page heading for each email option", () => {
    render(<LoginForm />);
    fireEvent.click(screen.getByRole("button", { name: "Forgot password?" }));
    expect(screen.getByRole("heading", { name: "Reset your password." })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Sign in with password" }));
    fireEvent.click(screen.getByRole("button", { name: "Sign in by email link" }));
    expect(screen.getByRole("heading", { name: "Sign in by email link." })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Sign in with password" }));
    fireEvent.click(screen.getByRole("button", { name: "First time? Set up password" }));
    expect(screen.getByRole("heading", { name: "Set up your password." })).toBeTruthy();
  });

  it("allows an existing short password to reach Supabase instead of rejecting it locally", async () => {
    signInWithPassword.mockResolvedValue({ error: { code: "invalid_credentials", message: "Invalid login credentials" } });
    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "member@imperial.ac.uk" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "six123" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in with email" }));
    await waitFor(() => expect(signInWithPassword).toHaveBeenCalledWith({ email: "member@imperial.ac.uk", password: "six123" }));
    expect(await screen.findByText("Email or password is incorrect.")).toBeTruthy();
  });

  it("tells an unconfirmed account to use the newest confirmation email", async () => {
    signInWithPassword.mockResolvedValue({ error: { code: "email_not_confirmed", message: "Email not confirmed" } });
    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "member@imperial.ac.uk" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in with email" }));
    expect(await screen.findByText("Confirm your email using the newest EFDS account email, or request a new account link.")).toBeTruthy();
  });
});
