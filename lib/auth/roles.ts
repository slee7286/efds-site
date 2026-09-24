import type { AccessRole, AgentScope } from "@/types/domain";

const hierarchy: Record<AccessRole, number> = {
  viewer: 1,
  member: 2,
  efds_member: 3,
  committee: 4,
  admin: 5,
};

const roleLabels: Record<AccessRole, string> = {
  viewer: "Viewer", member: "EFDS member", efds_member: "EFDS student", committee: "Committee", admin: "Admin",
};

export function roleLabel(role: AccessRole) {
  return roleLabels[role];
}

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
  return role === "efds_member" ? "member" : "public";
}

export function canUseScope(role: AccessRole, requestedScope: AgentScope) {
  if (requestedScope === "public") return true;
  if (requestedScope === "member") return hasMinimumRole(role, "efds_member");
  if (requestedScope === "committee") return hasMinimumRole(role, "committee");
  return canAccessAdmin(role);
}
