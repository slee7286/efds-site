import type { AccessRole, AgentScope } from "@/types/domain";

const hierarchy: Record<AccessRole, number> = {
  viewer: 1,
  member: 2,
  committee: 3,
  admin: 4,
};

export function hasMinimumRole(role: AccessRole, required: AccessRole) {
  return hierarchy[role] >= hierarchy[required];
}

export function canAccessAdmin(role: AccessRole) {
  return role === "admin";
}

export function canAccessCommittee(role: AccessRole) {
  return hasMinimumRole(role, "committee");
}

export function scopeForRole(role: AccessRole): AgentScope {
  if (role === "admin") return "admin";
  if (role === "committee") return "committee";
  return role === "member" ? "member" : "public";
}

export function canUseScope(role: AccessRole, requestedScope: AgentScope) {
  if (requestedScope === "public") return true;
  if (requestedScope === "member") return hasMinimumRole(role, "member");
  if (requestedScope === "committee") return hasMinimumRole(role, "committee");
  return canAccessAdmin(role);
}
