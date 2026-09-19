"use client";

import { useState } from "react";

export function HeaderSignOutButton({ mobile = false }: { mobile?: boolean }) {
  const [pending, setPending] = useState(false);

  const signOut = async () => {
    if (pending) return;
    setPending(true);
    try {
      await fetch("/api/auth/sign-out", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
      });
    } catch {
      // Session cookie cleanup is best-effort; still leave the signed-in view.
    }
    window.location.assign("/");
  };

  if (mobile) {
    return (
      <button type="button" onClick={() => void signOut()} disabled={pending}>
        {pending ? "Logging out…" : "Log out"}
      </button>
    );
  }

  return (
    <button
      className="signin-link header-signout"
      type="button"
      onClick={() => void signOut()}
      disabled={pending}
    >
      {pending ? "Logging out…" : "Log out"}
    </button>
  );
}
