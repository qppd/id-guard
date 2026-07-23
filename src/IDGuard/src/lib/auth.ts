import { cookies } from "next/headers";
import { NextResponse } from "next/server";

interface AuthResult {
  ok: true;
  token: string;
}

interface AuthError {
  ok: false;
  response: NextResponse;
}

const REFRESHED_FLAG = Symbol("refreshed");

/**
 * Retrieves the TTLock access token from cookies.
 * If the token is missing, returns a 401 response.
 * Does NOT auto-refresh here — refresh happens in callWithAuth.
 */
async function getToken(): Promise<AuthResult | AuthError> {
  const cookieStore = await cookies();
  const token = cookieStore.get("tt_token")?.value;
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "Not authenticated" },
        { status: 401 }
      ),
    };
  }
  return { ok: true, token };
}

/**
 * Attempts to refresh the TTLock access token using the refresh token cookie.
 * On success, sets the new tokens as cookies on the provided response and returns the new access token.
 * On failure, returns null.
 */
async function tryRefresh(): Promise<string | null> {
  const cookieStore = await cookies();
  const refresh = cookieStore.get("tt_refresh")?.value;
  if (!refresh) return null;

  try {
    const { refreshToken } = await import("@/lib/ttlock");
    const data = await refreshToken(refresh);
    return data.access_token;
  } catch {
    return null;
  }
}

/**
 * Wraps an API call with automatic token refresh on auth failures.
 *
 * Pattern:
 * 1. Read token from cookie
 * 2. Call the API function with the token
 * 3. If the API throws an auth-related error (token expired), try refreshing the token
 * 4. If refresh succeeds, retry the API call with the new token (once)
 * 5. If refresh fails or the retry fails, return the error
 *
 * Usage in route handlers:
 * ```ts
 * const result = await callWithAuth(async (token) => {
 *   const { listRecords } = await import("@/lib/ttlock");
 *   return listRecords(token, lockId, page);
 * });
 * if (!result.ok) return result.response;
 * return NextResponse.json({ ok: true, data: result.data.list });
 * ```
 */
export async function callWithAuth<T>(
  fn: (token: string) => Promise<T>
): Promise<
  | { ok: true; data: T }
  | { ok: false; response: NextResponse }
> {
  const auth = await getToken();
  if (!auth.ok) return { ok: false, response: auth.response };

  try {
    const data = await fn(auth.token);
    return { ok: true, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    const isAuthError =
      message.includes("token") ||
      message.includes("auth") ||
      message.includes("expired") ||
      message.includes("401") ||
      message.includes("403");

    if (!isAuthError) {
      // Non-auth error — return as 502
      return {
        ok: false,
        response: NextResponse.json(
          { ok: false, error: message },
          { status: 502 }
        ),
      };
    }

    // Auth error — try refresh
    const newToken = await tryRefresh();
    if (!newToken) {
      return {
        ok: false,
        response: NextResponse.json(
          { ok: false, error: "Session expired. Please log in again." },
          { status: 401 }
        ),
      };
    }

    // Retry with new token (one attempt only)
    try {
      const data = await fn(newToken);
      return { ok: true, data };
    } catch (retryErr) {
      const retryMessage =
        retryErr instanceof Error ? retryErr.message : "Failed";
      const retryIsAuth =
        retryMessage.includes("token") ||
        retryMessage.includes("auth") ||
        retryMessage.includes("expired");
      return {
        ok: false,
        response: NextResponse.json(
          { ok: false, error: retryMessage },
          { status: retryIsAuth ? 401 : 502 }
        ),
      };
    }
  }
}
