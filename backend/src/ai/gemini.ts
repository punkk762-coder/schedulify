import { aiActionSchema, type AIAction } from "../validation/schemas";

export interface ChatContext {
  todayDate: string;
  timezone: string;
  todayOccurrences: Array<{
    id: string;
    title: string;
    category: string;
    time: string;
    status: string;
  }>;
  recentMessages?: Array<{ role: string; content: string }>;
}

export interface AIResponse {
  reply: string;
  action?: AIAction;
}

const SYSTEM_PROMPT = `You are Schedulfy AI, an intelligent personal routine and habit execution assistant.
Your job is to understand the user's natural language statements about their daily routine, meals, workouts, and supplements, and convert them into structured actions.

Current context:
- You must always be encouraging, concise, and direct.
- You can mark items COMPLETE, SKIP, REPLACE (with alternative), RESCHEDULE, QUERY information, or parse an IMPORT of a weekly plan.
- If user input is ambiguous (e.g. "I ate some food"), use intent "ASK_CLARIFICATION".
- For everyday completions (e.g. "finished my walk", "had lunch", "done with proats"), return intent "COMPLETE" with the target item ID and name from today's occurrences.
- For replacements (e.g. "had whey instead of oats"), return intent "REPLACE" with target and replacement.
- For plan text pasted by the user, return intent "IMPORT".

You MUST return a JSON object with:
{
  "reply": "Concise natural language answer to the user",
  "action": {
    "intent": "COMPLETE" | "SKIP" | "REPLACE" | "RESCHEDULE" | "QUERY" | "IMPORT" | "ASK_CLARIFICATION" | "ANSWER",
    "effectiveDate": "YYYY-MM-DD",
    "target": { "type": "routine_item" | "occurrence", "name": "...", "id": "..." },
    "replacement": { "type": "routine_item", "name": "...", "id": "..." },
    "scope": "TODAY_ONLY" | "FUTURE_OCCURRENCES",
    "data": {}
  }
}`;

/**
 * Call Gemini API or fallback heuristic parser
 */
export async function processUserMessage(
  message: string,
  context: ChatContext
): Promise<AIResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  // Route multi-line plans or complex dietary instructions to reasoning model, everyday check-ins to fast model
  const isReasoningNeeded = message.includes("\n") || message.length > 120 || /plan|diet|routine|macro|substitut|analy/i.test(message);
  const model = isReasoningNeeded
    ? (process.env.GEMINI_MODEL_REASONING || "gemini-3.8-flash")
    : (process.env.GEMINI_MODEL_FAST || "gemini-3.5-flash-lite");
  const maxOutputTokens = isReasoningNeeded ? 2048 : (Number(process.env.GEMINI_MAX_OUTPUT_TOKENS) || 1024);

  if (apiKey) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const contextSummary = `Today is ${context.todayDate} (${context.timezone}).
Today's routine items:
${context.todayOccurrences.map((o) => `- [${o.status}] ${o.time} - ${o.title} (${o.category}, id: ${o.id})`).join("\n")}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `${SYSTEM_PROMPT}\n\nContext:\n${contextSummary}\n\nUser message: "${message}"\n\nReturn strictly valid JSON:`,
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2,
            maxOutputTokens,
          },
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as any;
        const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidate) {
          const parsed = JSON.parse(candidate);
          const reply = parsed.reply || "Got it.";
          let action: AIAction | undefined;

          if (parsed.action && parsed.action.intent) {
            const validated = aiActionSchema.safeParse(parsed.action);
            if (validated.success) {
              action = validated.data;
            }
          }

          return { reply, action };
        }
      }
    } catch (err) {
      console.warn("Gemini API call failed, falling back to local heuristic:", err);
    }
  }

  // Local heuristic fallback when API key is missing or offline
  return parseHeuristic(message, context);
}

/**
 * Rule-based heuristic intent parser for offline / test reliability
 */
function parseHeuristic(message: string, context: ChatContext): AIResponse {
  const lower = message.toLowerCase().trim();

  // Check for plan import intent (multiline or contains days / meal plan keywords)
  if (
    lower.includes("diet plan") ||
    lower.includes("routine plan") ||
    lower.includes("monday") && lower.includes("tuesday") ||
    message.split("\n").length > 4
  ) {
    return {
      reply: "I detected a routine plan! You can review the parsed components and confirm importing it into your schedule.",
      action: {
        intent: "IMPORT",
        data: { rawText: message },
      },
    };
  }

  // Check for replacement
  if (lower.includes("instead of") || lower.includes("replaced with") || lower.includes("had") && lower.includes("instead")) {
    const targetMatch = context.todayOccurrences.find((o) =>
      lower.includes(o.title.toLowerCase())
    );

    return {
      reply: targetMatch
        ? `Understood. I will record the substitution for ${targetMatch.title}.`
        : "I recognized a replacement request. Which item would you like to swap?",
      action: {
        intent: "REPLACE",
        target: targetMatch ? { type: "occurrence", id: targetMatch.id, name: targetMatch.title } : undefined,
      },
    };
  }

  // Check for skip
  if (lower.includes("skip") || lower.includes("couldn't") || lower.includes("missed") || lower.includes("pass on")) {
    const matched = context.todayOccurrences.find((o) =>
      lower.includes(o.title.toLowerCase())
    );

    if (matched) {
      return {
        reply: `Marked "${matched.title}" as skipped for today. No problem, we'll get back on track tomorrow.`,
        action: {
          intent: "SKIP",
          target: { type: "occurrence", id: matched.id, name: matched.title },
        },
      };
    }
  }

  // Check for completion
  if (
    lower.includes("done") ||
    lower.includes("finished") ||
    lower.includes("completed") ||
    /\bate\b/i.test(lower) ||
    lower.includes("drank") ||
    lower.includes("had ")
  ) {
    const matched = context.todayOccurrences.find((o) =>
      lower.includes(o.title.toLowerCase())
    );

    if (matched) {
      return {
        reply: `Marked "${matched.title}" as complete! Great job keeping up with your routine.`,
        action: {
          intent: "COMPLETE",
          target: { type: "occurrence", id: matched.id, name: matched.title },
        },
      };
    }
  }

  // Check for query
  if (lower.includes("what") || lower.includes("how much") || lower.includes("status") || lower.includes("schedule")) {
    const pending = context.todayOccurrences.filter((o) => o.status === "PENDING");
    return {
      reply: `You have ${pending.length} pending items left for today:\n${pending.map((p) => `• ${p.time} - ${p.title}`).join("\n")}`,
      action: {
        intent: "QUERY",
      },
    };
  }

  // Default conversational answer
  return {
    reply: `I heard: "${message}". You can tell me when you finish an item (e.g. "finished my walk"), want to skip something, or swap a meal!`,
    action: {
      intent: "ANSWER",
    },
  };
}
