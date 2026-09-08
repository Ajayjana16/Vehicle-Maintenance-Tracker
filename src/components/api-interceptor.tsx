"use client";

import { useEffect } from "react";

export default function ApiInterceptor() {
  useEffect(() => {
    if (typeof window === "undefined" || !window.fetch) return;

    const originalFetch = window.fetch;

    window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
      let isApiRequest = false;

      if (typeof input === "string") {
        isApiRequest = input.startsWith("/api") || input.includes("/api/");
      } else if (input instanceof URL) {
        isApiRequest = input.pathname.startsWith("/api");
      } else if (input && typeof input === "object" && "url" in input) {
        isApiRequest = (input as Request).url.includes("/api/");
      }

      if (isApiRequest) {
        const headers = new Headers(init?.headers);
        if (!headers.has("ngrok-skip-browser-warning")) {
          headers.set("ngrok-skip-browser-warning", "true");
        }
        if (!headers.has("Accept") && (!init?.method || init.method.toUpperCase() === "GET")) {
          headers.set("Accept", "application/json");
        }

        return originalFetch.call(window, input, {
          ...init,
          headers,
        });
      }

      return originalFetch.call(window, input, init);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}
