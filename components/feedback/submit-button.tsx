"use client";

import type { ButtonHTMLAttributes } from "react";
import { useFormStatus } from "react-dom";

export function SubmitButton({ children, disabled, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { pending } = useFormStatus();
  return <button {...props} type="submit" disabled={disabled || pending} aria-busy={pending}>{pending ? "Saving…" : children}</button>;
}
