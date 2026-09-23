export const PROFILE_PHOTO_BUCKET = "efds-profile-photos";
export const MAX_SOURCE_PHOTO_BYTES = 5 * 1024 * 1024;
export const MAX_STORED_PHOTO_BYTES = 2 * 1024 * 1024;
const acceptedPhotoTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export function validateProfilePhoto(file: Pick<File, "type" | "size">) {
  if (!acceptedPhotoTypes.has(file.type)) return "Choose a JPG, PNG or WebP image.";
  if (file.size > MAX_SOURCE_PHOTO_BYTES) return "Choose an image smaller than 5 MB.";
  if (file.size === 0) return "This image is empty. Choose another file.";
  return null;
}

export function profilePhotoUrl(path: string) {
  return `/api/profile/photo?v=${encodeURIComponent(path)}`;
}

export function profileInitials(name: string | null, email: string | null) {
  const words = (name?.trim() || email?.split("@")[0] || "EFDS").split(/\s+/).filter(Boolean);
  const letters = words.length > 1 ? `${Array.from(words[0])[0]}${Array.from(words.at(-1) ?? "")[0]}` : Array.from(words[0] ?? "EF").slice(0, 2).join("");
  return letters.toLocaleUpperCase();
}
