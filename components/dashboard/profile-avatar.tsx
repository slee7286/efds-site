import Image from "next/image";
import { profileInitials, profilePhotoUrl } from "@/lib/auth/profile-photo";

export function ProfileAvatar({ name, email, avatarPath, size = 40 }: { name: string | null; email: string | null; avatarPath: string | null; size?: number }) {
  return <span className="profile-avatar" style={{ width: size, height: size }} aria-hidden="true">
    {avatarPath ? <Image src={profilePhotoUrl(avatarPath)} alt="" width={size} height={size} unoptimized /> : profileInitials(name, email)}
  </span>;
}
