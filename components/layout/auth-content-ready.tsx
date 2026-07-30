"use client";

import { useEffect } from "react";

export function AuthContentReady() {
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("auth-content-ready", {
        detail: window.location.pathname,
      }),
    );
  }, []);

  return null;
}
