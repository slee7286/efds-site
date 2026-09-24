// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const verifyOtp = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase/client", () => ({ createBrowserSupabaseClient: () => ({ auth: { verifyOtp } }) }));

import { VerifyCodeForm } from "../components/auth/verify-code-form";

describe("email code fallback", () => {
  beforeEach(() => {
    verifyOtp.mockReset().mockResolvedValue({ error: { code: "otp_expired" } });
  });

  it.each([
    ["setup", "email"],
    ["reset", "recovery"],
    ["magic", "email"],
  ] as const)("verifies the %s code with the right Supabase flow", async (flow, type) => {
    render(<VerifyCodeForm flow={flow} />);
    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "Member@Imperial.ac.uk" } });
    fireEvent.change(screen.getByLabelText("One-time code"), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "Verify and continue" }));
    await waitFor(() => expect(verifyOtp).toHaveBeenCalledWith({ email: "member@imperial.ac.uk", token: "123456", type }));
    expect((await screen.findByRole("alert")).textContent).toContain("otp_expired");
    expect((screen.getByRole("button", { name: "Verify and continue" }) as HTMLButtonElement).disabled).toBe(false);
  });
});
