import type { SessionOptions } from "iron-session";

export interface SessionData {
  userId: string;
  role: "USER" | "MOM";
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || "dev-secret-replace-in-production!!",
  cookieName: "schedulfy-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};
