import type { Request, Response, NextFunction } from "express";

export interface SessionData {
  userId: string;
  role: "USER" | "MOM";
}

export function getSession(req: Request): SessionData | null {
  try {
    const cookie = req.cookies?.schedulfy_session;
    if (cookie) {
      const parsed = typeof cookie === "string" ? JSON.parse(cookie) : cookie;
      if (parsed.userId && parsed.role) {
        return parsed;
      }
    }
  } catch {
    // Malformed session
  }
  return null;
}

export function setSession(res: Response, session: SessionData) {
  res.cookie("schedulfy_session", JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  });
}

export function destroySession(res: Response) {
  res.clearCookie("schedulfy_session", { path: "/" });
}

export function requireUserMiddleware(req: Request, res: Response, next: NextFunction) {
  const session = getSession(req);
  if (!session || session.role !== "USER") {
    res.status(401).json({ error: "Unauthorized — USER role required" });
    return;
  }
  (req as Request & { user: SessionData }).user = session;
  next();
}

export function requireMomMiddleware(req: Request, res: Response, next: NextFunction) {
  const session = getSession(req);
  if (!session || session.role !== "MOM") {
    res.status(401).json({ error: "Unauthorized — MOM role required" });
    return;
  }
  (req as Request & { user: SessionData }).user = session;
  next();
}

/**
 * Timing-safe PIN verification
 */
export function verifyPin(input: string, expected: string): boolean {
  if (input.length !== expected.length) return false;
  const encoder = new TextEncoder();
  const a = encoder.encode(input);
  const b = encoder.encode(expected);
  if (a.byteLength !== b.byteLength) return false;
  let result = 0;
  for (let i = 0; i < a.byteLength; i++) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
}
