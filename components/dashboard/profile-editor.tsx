"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { showActionToast } from "@/components/feedback/action-toast";
import { ProfileAvatar } from "@/components/dashboard/profile-avatar";
import { MAX_STORED_PHOTO_BYTES, PROFILE_PHOTO_BUCKET, validateProfilePhoto } from "@/lib/auth/profile-photo";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { AccessProfile } from "@/types/domain";

async function preparePhoto(file: File) {
  const bitmap = await createImageBitmap(file);
  try {
    if (!bitmap.width || !bitmap.height || bitmap.width * bitmap.height > 30_000_000) throw new Error("Choose an image under 30 megapixels.");
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("This browser could not prepare the image. Please try another browser.");
    const sourceSize = Math.min(bitmap.width, bitmap.height);
    context.drawImage(bitmap, (bitmap.width - sourceSize) / 2, (bitmap.height - sourceSize) / 2, sourceSize, sourceSize, 0, 0, 512, 512);
    const result = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.86));
    if (!result || result.type !== "image/webp") throw new Error("This browser could not prepare a WebP photo. Please try another browser.");
    if (result.size > MAX_STORED_PHOTO_BYTES) throw new Error("The processed photo is too large. Try a simpler image.");
    return result;
  } finally {
    bitmap.close();
  }
}

export function ProfileEditor({ profile }: { profile: AccessProfile | null }) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(profile?.fullName ?? "");
  const [savedName, setSavedName] = useState(profile?.fullName ?? "");
  const [avatarPath, setAvatarPath] = useState(profile?.avatarPath ?? null);
  const [savingName, setSavingName] = useState(false);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [nameMessage, setNameMessage] = useState("");
  const [photoMessage, setPhotoMessage] = useState("");
  const [nameError, setNameError] = useState(false);
  const [photoError, setPhotoError] = useState(false);
  const available = Boolean(profile);

  async function currentAccount() {
    const supabase = createBrowserSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user || user.id !== profile?.authUserId) throw new Error("Your session has expired. Sign in again before editing your profile.");
    return { supabase, user };
  }

  async function saveName(event: React.FormEvent) {
    event.preventDefault();
    const normalized = name.trim().replace(/\s+/g, " ");
    if (!normalized || normalized.length > 120) {
      setNameError(true);
      setNameMessage("Enter a name of no more than 120 characters.");
      return;
    }
    setSavingName(true);
    setNameMessage("");
    try {
      const { supabase, user } = await currentAccount();
      const { error } = await supabase.from("profiles").update({ full_name: normalized }).eq("auth_user_id", user.id).select("id").single();
      if (error) throw new Error("Your name could not be saved. Please try again.");
      setName(normalized);
      setSavedName(normalized);
      setNameError(false);
      setNameMessage("Your display name has been saved.");
      showActionToast("Display name saved.");
      router.refresh();
    } catch (error) {
      setNameError(true);
      setNameMessage(error instanceof Error ? error.message : "Your name could not be saved. Please try again.");
      showActionToast("Display name could not be saved.", true);
    } finally {
      setSavingName(false);
    }
  }

  async function uploadPhoto(file: File) {
    const problem = validateProfilePhoto(file);
    if (problem) { setPhotoError(true); setPhotoMessage(problem); return; }
    setSavingPhoto(true);
    setPhotoMessage("");
    try {
      const image = await preparePhoto(file);
      const { supabase, user } = await currentAccount();
      const nextPath = `${user.id}/${crypto.randomUUID()}.webp`;
      const storage = supabase.storage.from(PROFILE_PHOTO_BUCKET);
      const { error: uploadError } = await storage.upload(nextPath, image, { contentType: "image/webp", upsert: false, cacheControl: "3600" });
      if (uploadError) throw new Error("The photo could not be uploaded. Please try again.");
      const { error: profileError } = await supabase.from("profiles").update({ avatar_path: nextPath }).eq("auth_user_id", user.id).select("id").single();
      if (profileError) {
        await storage.remove([nextPath]);
        throw new Error("The photo uploaded but could not be saved to your profile. Please try again.");
      }
      const previousPath = avatarPath;
      setAvatarPath(nextPath);
      setPhotoError(false);
      setPhotoMessage("Your profile photo has been updated.");
      showActionToast("Profile photo saved.");
      router.refresh();
      if (previousPath) {
        const { error: cleanupError } = await storage.remove([previousPath]);
        if (cleanupError) setPhotoMessage("Your photo is updated, but the previous file could not be removed.");
      }
    } catch (error) {
      setPhotoError(true);
      setPhotoMessage(error instanceof Error ? error.message : "The photo could not be uploaded. Please try again.");
      showActionToast("Profile photo could not be saved.", true);
    } finally {
      if (fileInput.current) fileInput.current.value = "";
      setSavingPhoto(false);
    }
  }

  async function removePhoto() {
    if (!avatarPath) return;
    setSavingPhoto(true);
    setPhotoMessage("");
    try {
      const { supabase, user } = await currentAccount();
      const previousPath = avatarPath;
      const { error } = await supabase.from("profiles").update({ avatar_path: null }).eq("auth_user_id", user.id).select("id").single();
      if (error) throw new Error("The photo could not be removed from your profile. Please try again.");
      setAvatarPath(null);
      setPhotoError(false);
      setPhotoMessage("Your profile photo has been removed.");
      showActionToast("Profile photo removed.");
      router.refresh();
      const { error: cleanupError } = await supabase.storage.from(PROFILE_PHOTO_BUCKET).remove([previousPath]);
      if (cleanupError) setPhotoMessage("Your photo is removed from your profile, but the old file could not be deleted.");
    } catch (error) {
      setPhotoError(true);
      setPhotoMessage(error instanceof Error ? error.message : "The photo could not be removed. Please try again.");
      showActionToast("Profile photo could not be removed.", true);
    } finally {
      setSavingPhoto(false);
    }
  }

  return <section className="surface profile-panel" aria-labelledby="profile-details-heading">
    <div className="profile-section-heading"><div><span className="eyebrow">Personal details</span><h2 id="profile-details-heading">Make this account yours.</h2></div><p>Your name and photo appear in your EFDS workspace.</p></div>
    <div className="profile-photo-row">
      <ProfileAvatar name={name || null} email={profile?.email ?? null} avatarPath={avatarPath} size={88} />
      <div className="profile-photo-controls">
        <label htmlFor="profile-photo">Profile photo</label>
        <input ref={fileInput} id="profile-photo" type="file" accept="image/jpeg,image/png,image/webp" disabled={!available || savingPhoto} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadPhoto(file); }} />
        <p>JPG, PNG or WebP, up to 5 MB. We crop the centre and save a compact square image.</p>
        {avatarPath && <button className="profile-text-button" type="button" disabled={savingPhoto} onClick={() => void removePhoto()}>Remove photo</button>}
        {savingPhoto && <p role="status">Updating photo…</p>}
        {photoMessage && <p className={photoError ? "profile-feedback-error" : "profile-feedback-success"} role={photoError ? "alert" : "status"}>{photoMessage}</p>}
      </div>
    </div>
    <form className="profile-name-form" onSubmit={saveName}>
      <label className="form-label" htmlFor="profile-name">Display name<input className="input" id="profile-name" name="full_name" autoComplete="name" maxLength={120} required disabled={!available || savingName} value={name} onChange={(event) => setName(event.target.value)} /></label>
      <button className="button button-primary" type="submit" disabled={!available || savingName || name.trim() === savedName}>{savingName ? "Saving…" : "Save name"}</button>
      {nameMessage && <p className={nameError ? "profile-feedback-error" : "profile-feedback-success"} role={nameError ? "alert" : "status"}>{nameMessage}</p>}
    </form>
    {!available && <p className="profile-preview-note" role="note">Profile editing is unavailable in this local preview. Sign in to a connected workspace to save changes.</p>}
  </section>;
}
