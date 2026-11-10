import { cookies } from "next/headers";

const ACCESS_TOKEN_COOKIE  = "sg_at";
const REFRESH_TOKEN_COOKIE = "sg_rt";
const SESSION_COOKIE       = "sg_sid";

const IS_PROD = process.env.NODE_ENV === "production";

interface TokenSet {
  accessToken:  string;
  refreshToken: string;
  sessionId:    string;
  expiresIn:    number;
}

export async function setAuthCookies(tokens: TokenSet) {
  const jar = await cookies();

  jar.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    httpOnly: true,
    secure:   IS_PROD,
    sameSite: "lax",
    maxAge:   tokens.expiresIn,
    path:     "/",
  });

  jar.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
    httpOnly: true,
    secure:   IS_PROD,
    sameSite: "lax",
    maxAge:   60 * 60 * 24 * 7, // 7 days
    path:     "/",
  });

  jar.set(SESSION_COOKIE, tokens.sessionId, {
    httpOnly: true,
    secure:   IS_PROD,
    sameSite: "lax",
    maxAge:   60 * 60 * 24 * 30,
    path:     "/",
  });
}

export async function clearAuthCookies() {
  const jar = await cookies();
  jar.delete(ACCESS_TOKEN_COOKIE);
  jar.delete(REFRESH_TOKEN_COOKIE);
  jar.delete(SESSION_COOKIE);
}

export async function getAccessTokenFromCookie(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(ACCESS_TOKEN_COOKIE)?.value ?? null;
}
