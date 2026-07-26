export type ProviderOutcome = { success: boolean; retry: boolean; code: string; delayMs: number };

export function providerOutcome(status: number | null, timedOut: boolean, attempt: number, maxAttempts = 5): ProviderOutcome {
  if (status !== null && status >= 200 && status < 300) return { success: true, retry: false, code: "sent", delayMs: 0 };
  const code = timedOut ? "provider_timeout"
    : status === 401 || status === 403 ? "provider_auth"
    : status === 429 ? "provider_rate_limited"
    : status !== null && status >= 500 ? "provider_unavailable"
    : "provider_error";
  const retryable = timedOut || status === 429 || (status !== null && status >= 500);
  return {
    success: false,
    retry: retryable && attempt < maxAttempts,
    code,
    delayMs: Math.min(24 * 60 * 60 * 1000, 60 * 1000 * 2 ** Math.max(0, attempt - 1)),
  };
}
