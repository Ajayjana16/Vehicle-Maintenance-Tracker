/**
 * AutoPulse Auth — JWT session helpers
 * Uses `jose` which works in both Node.js and Edge runtimes.
 * Session cookie is httpOnly, SameSite=Lax, Secure in production.
 */

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
}

const COOKIE_NAME = "ap_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET || "autopulse-enterprise-jwt-secret-key-2025-secure-token";
  return new TextEncoder().encode(secret);
}

export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/** Set httpOnly session cookie (server actions / route handlers) */
export async function setSessionCookie(payload: SessionPayload, rememberMe: boolean = false): Promise<void> {
  const token = await signToken(payload);
  const cookieStore = cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    ...(rememberMe ? { maxAge: COOKIE_MAX_AGE } : {}),
    path: "/",
  });
}

/** Clear session cookie (server actions / route handlers) */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

/** Read + verify session from Next.js server context (route handlers) */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/** Read + verify session from a raw NextRequest (middleware) */
export async function getSessionFromRequest(
  request: NextRequest
): Promise<SessionPayload | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}
