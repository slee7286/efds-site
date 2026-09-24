// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { OfficerAccountForm } from "../components/admin/officer-account-form";
import type { CommitteeIdentity } from "../lib/db/committee";

vi.mock("../lib/actions/officers", () => ({
  linkOfficerAccount: vi.fn(),
  unlinkOfficerAccount: vi.fn(),
}));

const officer: CommitteeIdentity = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Example Officer",
  role: "Events",
  academicYear: "2026–27",
  accounts: [
    { id: "22222222-2222-4222-8222-222222222222", version: 4, email: "first@imperial.ac.uk", name: "First Officer" },
  ],
};

describe("officer account form", () => {
  it("offers the second slot while showing an independent unlink action", () => {
    render(<OfficerAccountForm officer={officer} />);
    expect(screen.getByText("first@imperial.ac.uk")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Remove link" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Link account" })).toBeTruthy();
  });

  it("shows both linked accounts and no third-slot form", () => {
    render(<OfficerAccountForm officer={{
      ...officer,
      accounts: [...officer.accounts, { id: "33333333-3333-4333-8333-333333333333", version: 1, email: "second@ic.ac.uk", name: "Second Officer" }],
    }} />);
    expect(screen.getByText("first@imperial.ac.uk")).toBeTruthy();
    expect(screen.getByText("second@ic.ac.uk")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Remove link" })).toHaveLength(2);
    expect(screen.queryByRole("button", { name: "Link account" })).toBeNull();
  });
});
