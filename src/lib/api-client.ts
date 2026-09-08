/**
 * AutoPulse Unified API Client
 * - Guarantees ngrok-skip-browser-warning header for public tunnels
 * - Guarantees Accept: application/json
 * - Enforces content-type and status validation
 * - Prevents silent JSON parsing crashes on HTML interstitial responses
 */

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

export interface ApiFetchOptions extends RequestInit {
  timeoutMs?: number;
}

export async function apiFetch<T = any>(
  url: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const { timeoutMs = 10000, signal: userSignal, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers || {});

  // Ngrok public tunnel compatibility header (bypasses browser warning interstitial on free tunnels)
  if (!headers.has("ngrok-skip-browser-warning")) {
    headers.set("ngrok-skip-browser-warning", "true");
  }

  // Ensure JSON acceptance
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  // If sending JSON body, set Content-Type
  if (fetchOptions.body && typeof fetchOptions.body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const controller = new AbortController();
  let timeoutId: NodeJS.Timeout | number | null = null;

  if (timeoutMs > 0) {
    timeoutId = setTimeout(() => {
      controller.abort(new Error(`Request timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  }

  // Link caller signal if provided
  if (userSignal) {
    userSignal.addEventListener("abort", () => {
      controller.abort(userSignal.reason);
    });
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });

    const contentType = response.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      const text = await response.text();
      if (text.includes("ngrok") || text.includes("<!DOCTYPE")) {
        throw new Error(
          "Received HTML interstitial instead of JSON. Public tunnel gateway warning was encountered."
        );
      }
      throw new Error(`Expected JSON response but received ${contentType || "unknown content"}`);
    }

    const data = await response.json();

    if (!response.ok) {
      const errorMessage =
        (data && typeof data === "object" && (data.error || data.message)) ||
        `Request failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    return data as T;
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new Error("Request was cancelled or timed out. Please try again.");
    }
    throw err;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}
