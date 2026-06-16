"use client";

import { useEffect } from "react";

export function PwaSetup() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || window.location.protocol !== "https:") {
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // The app still works normally when service worker registration is blocked.
    });
  }, []);

  return null;
}
