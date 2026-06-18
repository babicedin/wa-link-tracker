import { cookies } from "next/headers";

const SESSION_COOKIE = "wa_admin_session";
const SESSION_SALT = "wa-click-tracker-v1";

async function hashSession(password: string): Promise<string> {
  const data = new TextEncoder().encode(`${password}:${SESSION_SALT}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function getSessionToken(): Promise<string> {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error("ADMIN_PASSWORD is not set");
  }
  return hashSession(password);
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export function verifyPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return safeEqual(password, expected);
}

export async function setSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, await getSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function isAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get(SESSION_COOKIE)?.value;
    if (!session) return false;
    return safeEqual(session, await getSessionToken());
  } catch {
    return false;
  }
}

export async function isAuthenticatedFromCookie(
  session: string | undefined
): Promise<boolean> {
  if (!session || !process.env.ADMIN_PASSWORD) return false;
  try {
    return safeEqual(session, await getSessionToken());
  } catch {
    return false;
  }
}

export { SESSION_COOKIE };
