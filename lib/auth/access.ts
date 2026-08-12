import type { AccessException, AccessRole } from "@/types/domain";

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function emailDomain(email: string) {
  const normalized = normalizeEmail(email);
  const at = normalized.lastIndexOf("@");
  if (at <= 0 || at !== normalized.indexOf("@")) return "";
  return normalized.slice(at + 1);
}

export function isAllowedImperialEmail(email: string, allowedDomains: string[]) {
  const domain = emailDomain(email);
  return allowedDomains.map((item) => item.toLowerCase()).includes(domain);
}

export function isActiveException(exception: AccessException | null | undefined, now = new Date()) {
  if (!exception || !exception.active) return false;
  if (!exception.expiresAt) return true;
  return new Date(exception.expiresAt).getTime() > now.getTime();
}

export function resolveAccess(email: string, allowedDomains: string[], exception?: AccessException | null) {
  if (isAllowedImperialEmail(email, allowedDomains)) {
    return { allowed: true, accessRole: "member" as AccessRole, memberType: "imperial" as const };
  }
  if (exception && isActiveException(exception)) {
    return { allowed: true, accessRole: exception.accessRole, memberType: "external" as const };
  }
  return { allowed: false, accessRole: null, memberType: null };
}
