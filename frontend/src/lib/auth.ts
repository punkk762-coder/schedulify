import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export interface SessionData {
  userId: string;
  role: "USER" | "MOM";
}

/**
 * Get session from cookies. Server-side only.
 */
export async function getSession(): Promise<Partial<SessionData>> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get("schedulfy_session")?.value;
  if (!cookie) return {};
  try {
    const parsed = JSON.parse(cookie);
    if (parsed.userId && parsed.role) {
      return parsed;
    }
  } catch {
    // Malformed session cookie
  }
  return {};
}

/**
 * Require authenticated session. Redirects to login if missing.
 */
export async function requireAuth(): Promise<SessionData> {
  const session = await getSession();
  if (!session.userId || !session.role) {
    redirect("/login");
  }
  return { userId: session.userId, role: session.role };
}

/**
 * Require USER role specifically.
 */
export async function requireUser(): Promise<SessionData> {
  const session = await requireAuth();
  if (session.role !== "USER") {
    redirect("/login");
  }
  return session;
}

/**
 * Require MOM role specifically.
 */
export async function requireMom(): Promise<SessionData> {
  const session = await requireAuth();
  if (session.role !== "MOM") {
    redirect("/login");
  }
  return session;
}
