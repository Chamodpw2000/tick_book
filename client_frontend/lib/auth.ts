export const AUTH_TOKEN_STORAGE_KEY = "AUTH_TOKEN";
export const AUTH_USER_STORAGE_KEY = "AUTH_USER";

export type AuthUser = {
  id: string;
  email: string;
  displayName?: string;
};

const AUTH_CHANGED_EVENT = "auth-changed";

export const notifyAuthChanged = () => {
  if (globalThis.window === undefined) return;
  globalThis.window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
};

export const getAuthTokenFromStorage = (): string | null => {
  if (globalThis.window === undefined) return null;

  try {
    return globalThis.window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const getAuthUserFromStorage = (): AuthUser | null => {
  if (globalThis.window === undefined) return null;

  try {
    const raw = globalThis.window.localStorage.getItem(AUTH_USER_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<AuthUser>;
    console.log(parsed, "parsed user");
    if (!parsed || typeof parsed !== "object") return null;
    if (typeof parsed.id !== "string" || typeof parsed.email !== "string") return null;

    return {
      id: parsed.id,
      email: parsed.email,
      displayName: typeof parsed.displayName === "string" ? parsed.displayName : undefined,
    };
  } catch {
    return null;
  }
};

export const setAuthTokenToStorage = (token: string) => {
  if (globalThis.window === undefined) return;

  try {
    globalThis.window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  } catch {
    // ignore
  }
};

export const setAuthUserToStorage = (user: { id: string; email: string; displayName?: string }) => {
  if (globalThis.window === undefined) return;

  const displayName = user.displayName?.trim() || "User";

  try {
    globalThis.window.localStorage.setItem(
      AUTH_USER_STORAGE_KEY,
      JSON.stringify({ id: user.id, email: user.email, displayName } satisfies AuthUser)
    );
  } catch {
    // ignore
  }
};

export const clearAuthTokenFromStorage = () => {
  if (globalThis.window === undefined) return;

  try {
    globalThis.window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  } catch {
    // ignore
  }
};

export const clearAuthUserFromStorage = () => {
  if (globalThis.window === undefined) return;

  try {
    globalThis.window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
  } catch {
    // ignore
  }
};
