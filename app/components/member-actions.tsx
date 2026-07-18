"use client";

import { useState } from "react";

export function DemoLogoutButton() {
  const [loading, setLoading] = useState(false);

  const logout = async () => {
    setLoading(true);
    await fetch("/api/demo-session", { method: "DELETE" }).catch(() => null);
    window.location.assign("/demo-login");
  };

  return (
    <button className="member-switch-button" type="button" onClick={logout} disabled={loading}>
      {loading ? "Switching…" : "Switch learner"}
    </button>
  );
}
