import { Router, type Request, type Response } from "express";
import { prisma } from "../db";
import { occurrenceService } from "../domain";
import { todayUtc, formatInTz } from "../dates";
import { processUserMessage } from "../ai/gemini";
import { requireUserMiddleware, type SessionData } from "../auth";
import type { Prisma } from "@prisma/client";

const router = Router();

router.post("/chat", requireUserMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const session = (req as Request & { user: SessionData }).user;
    const { message, conversationId } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      res.status(400).json({ error: "Message cannot be empty" });
      return;
    }

    const today = todayUtc();
    const rawOccurrences = await occurrenceService.getForDate(today);
    const todayOccurrences = rawOccurrences.map((o) => ({
      id: o.id,
      title: o.routineItem.title,
      category: o.routineItem.category,
      time: o.scheduledTime,
      status: o.status,
    }));

    let conv = conversationId
      ? await prisma.conversation.findUnique({ where: { id: conversationId } })
      : null;

    if (!conv) {
      conv = await prisma.conversation.create({
        data: {
          userId: session.userId,
          title: message.slice(0, 40),
        },
      });
    }

    await prisma.message.create({
      data: {
        conversationId: conv.id,
        role: "USER",
        content: message,
      },
    });

    const aiResult = await processUserMessage(message, {
      todayDate: formatInTz(today, "EEEE, MMMM d, yyyy"),
      timezone: process.env.APP_TIMEZONE || "Asia/Kolkata",
      todayOccurrences,
    });

    let actionStatus = "PROPOSED";
    if (aiResult.action) {
      if (aiResult.action.intent === "COMPLETE" && aiResult.action.target?.id) {
        try {
          await occurrenceService.complete(aiResult.action.target.id);
          actionStatus = "EXECUTED";
        } catch {
          actionStatus = "FAILED";
        }
      } else if (aiResult.action.intent === "SKIP" && aiResult.action.target?.id) {
        try {
          await occurrenceService.skip(aiResult.action.target.id);
          actionStatus = "EXECUTED";
        } catch {
          actionStatus = "FAILED";
        }
      }
    }

    const assistantMsg = await prisma.message.create({
      data: {
        conversationId: conv.id,
        role: "ASSISTANT",
        content: aiResult.reply,
        actionType: aiResult.action?.intent,
        actionPayload: (aiResult.action || null) as Prisma.InputJsonValue,
        actionStatus,
      },
    });

    res.json({
      conversationId: conv.id,
      messageId: assistantMsg.id,
      reply: aiResult.reply,
      action: aiResult.action,
      actionStatus,
    });
  } catch (err) {
    console.error("POST /api/chat error:", err);
    res.status(500).json({ error: "Failed to process chat" });
  }
});

router.get("/chat", requireUserMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const session = (req as Request & { user: SessionData }).user;
    const conversationId = req.query.conversationId as string | undefined;

    if (conversationId) {
      const messages = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: "asc" },
      });
      res.json({ messages });
      return;
    }

    const conversations = await prisma.conversation.findMany({
      where: { userId: session.userId },
      orderBy: { updatedAt: "desc" },
      take: 10,
    });

    res.json({ conversations });
  } catch (err) {
    console.error("GET /api/chat error:", err);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

export default router;
