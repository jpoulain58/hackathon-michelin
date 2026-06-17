"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type SignOutButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label?: string;
  loadingLabel?: string;
  redirectTo?: string;
};

export function SignOutButton({
  children,
  className,
  label = "Se deconnecter",
  loadingLabel = "Deconnexion...",
  redirectTo = "/",
  disabled,
  onClick,
  ...props
}: SignOutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  async function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    onClick?.(event);
    if (event.defaultPrevented) return;

    setLoading(true);
    try {
      await supabase?.auth.signOut();
      router.push(redirectTo);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      className={cn(className)}
      disabled={disabled || loading}
      aria-busy={loading}
      onClick={handleClick}
      {...props}
    >
      {children}
      {loading ? loadingLabel : label}
    </button>
  );
}
