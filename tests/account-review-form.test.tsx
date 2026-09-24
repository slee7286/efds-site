// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AccountReviewForm } from "@/components/admin/account-review-form";
import type { ReviewAccount } from "@/lib/db/accounts";

vi.mock("@/lib/actions/accounts", () => ({ reviewAccount: vi.fn() }));

const account: ReviewAccount = {
  id: "11111111-1111-4111-8111-111111111111", email: "student@ic.ac.uk", fullName: "Student",
  role: "member", memberType: "imperial", verificationStatus: "pending", claim: null,
  officerId: null, version: 1, createdAt: "2026-09-24T00:00:00Z", verifiedAt: null,
};

describe("account membership decisions", () => {
  it("labels the non-EFDS outcome as standard membership", () => {
    render(<AccountReviewForm account={account} officers={[]} isSelf={false} />);
    expect(screen.getByRole("option", { name: "Confirm standard membership" })).toBeTruthy();
    expect(screen.queryByText(/Decline verification/i)).toBeNull();
  });

  it("keeps verification available after a standard-member decision", () => {
    render(<AccountReviewForm account={{ ...account, verificationStatus: "declined" }} officers={[]} isSelf={false} />);
    expect(screen.getByRole("option", { name: "Verify EFDS membership" })).toBeTruthy();
    expect(screen.queryByRole("option", { name: "Confirm standard membership" })).toBeNull();
  });
});
