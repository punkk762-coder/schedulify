import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

dotenv.config({ override: true });

import authRouter from "./routes/auth";
import todayRouter from "./routes/today";
import occurrencesRouter from "./routes/occurrences";
import momRouter from "./routes/mom";
import chatRouter from "./routes/chat";
import plansRouter from "./routes/plans";
import analyticsRouter from "./routes/analytics";
import historyRouter from "./routes/history";
import settingsRouter from "./routes/settings";
import calendarRouter from "./routes/calendar";
import setupRouter from "./routes/setup";

const app = express();
const PORT = process.env.PORT || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

app.use(
  cors({
    origin: [FRONTEND_URL, "http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());

// Enable strong HTTP ETag caching for conditional GET (304 Not Modified)
app.set("etag", "strong");

// HTTP Cache-Control: dynamic GET endpoints revalidate via ETag; mutations never cached
app.use((req, res, next) => {
  if (req.method === "GET") {
    res.setHeader("Cache-Control", "private, no-cache, must-revalidate");
  } else {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  }
  next();
});

import { prisma } from "./db";

// Health check (Supports UptimeRobot GET/HEAD pings with DB connectivity probe)
app.all(["/health", "/api/health"], async (_req, res) => {
  let dbStatus = "healthy";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = "unavailable";
  }

  const isHealthy = dbStatus === "healthy";
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? "ok" : "degraded",
    service: "schedulfy-backend",
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: dbStatus,
  });
});

// API Routes
app.use("/api/auth", authRouter);
app.use("/api", todayRouter);
app.use("/api", occurrencesRouter);
app.use("/api", momRouter);
app.use("/api", chatRouter);
app.use("/api", plansRouter);
app.use("/api", analyticsRouter);
app.use("/api", historyRouter);
app.use("/api", settingsRouter);
app.use("/api", calendarRouter);
app.use("/api", setupRouter);

// Start server
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`⚡ Schedulfy Backend listening on http://localhost:${PORT}`);
  });
}

export default app;
