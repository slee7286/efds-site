import { describe, expect, it } from "vitest";
import { isActiveException, isAllowedImperialEmail, normalizeEmail, resolveAccess } from "../lib/auth/access";
import { canAccessAdmin, canAccessCommittee, canUseScope, scopeForRole } from "../lib/auth/roles";

const domains = ["ic.ac.uk", "imperial.ac.uk"];

describe("EFDS access policy", () => {
  it("allows Imperial domains case-insensitively", () => {
    expect(normalizeEmail(" Student@IC.AC.UK ")).toBe("student@ic.ac.uk");
    expect(isAllowedImperialEmail("Student@IC.AC.UK", domains)).toBe(true);
    expect(isAllowedImperialEmail("person@imperial.ac.uk", domains)).toBe(true);
  });

  it("denies external accounts without an exception", () => {
    expect(resolveAccess("person@example.com", domains)).toMatchObject({ allowed: false, accessRole: null });
  });

  it("allows an active unexpired exception and denies inactive or expired exceptions", () => {
    expect(isActiveException({ email: "guest@example.com", accessRole: "viewer", active: true, expiresAt: "2099-01-01" })).toBe(true);
    expect(resolveAccess("guest@example.com", domains, { email: "guest@example.com", accessRole: "viewer", active: true, expiresAt: "2099-01-01" })).toMatchObject({ allowed: true, accessRole: "viewer" });
    expect(isActiveException({ email: "guest@example.com", accessRole: "member", active: false })).toBe(false);
    expect(isActiveException({ email: "guest@example.com", accessRole: "member", active: true, expiresAt: "2020-01-01" })).toBe(false);
  });
});

describe("role and agent boundaries", () => {
  it("keeps the hierarchy server-side", () => {
    expect(canAccessAdmin("member")).toBe(false);
    expect(canAccessCommittee("committee")).toBe(true);
    expect(canAccessAdmin("admin")).toBe(true);
    expect(scopeForRole("member")).toBe("member");
    expect(scopeForRole("viewer")).toBe("public");
  });

  it("does not let a member request committee or admin retrieval", () => {
    expect(canUseScope("member", "public")).toBe(true);
    expect(canUseScope("member", "member")).toBe(true);
    expect(canUseScope("member", "committee")).toBe(false);
    expect(canUseScope("member", "admin")).toBe(false);
    expect(canUseScope("viewer", "member")).toBe(false);
  });
});
