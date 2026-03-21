import { loadDatabase, normalizeUrl } from "./_lib/db";

const setCors = (res: any) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
};

const extractTerms = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((term) => term.length > 2);

const scoreChunk = (chunk: string, terms: string[]) => {
  const haystack = chunk.toLowerCase();
  let score = 0;
  for (const term of terms) {
    if (haystack.includes(term)) {
      score += 1;
    }
  }
  return score;
};

const buildContext = (chunks: string[], question: string) =>
  chunks
    .map((chunk) => ({ chunk, score: scoreChunk(chunk, extractTerms(question)) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((item) => item.chunk)
    .join("\n\n---\n\n")
    .slice(0, 4000);

export default async function handler(req: any, res: any) {
  setCors(res);
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    res.status(500).json({ error: "Missing GROQ_API_KEY" });
    return;
  }

  const { siteUrl, messages, stream, siteKey } = req.body ?? {};
  if (!siteUrl || typeof siteUrl !== "string") {
    res.status(400).json({ error: "Missing siteUrl" });
    return;
  }

  const userMessage = Array.isArray(messages)
    ? messages.filter((msg: any) => msg?.role === "user").slice(-1)[0]?.content
    : undefined;

  if (!userMessage || typeof userMessage !== "string") {
    res.status(400).json({ error: "Missing user message" });
    return;
  }

  const normalizedSiteUrl = normalizeUrl(siteUrl);
  const key =
    siteKey && typeof siteKey === "string" ? siteKey : new URL(normalizedSiteUrl).hostname;
  const db = await loadDatabase();
  const docStore = db.docs.find((entry) => entry.siteKey === key);
  const context = docStore ? buildContext(docStore.chunks, userMessage) : "";

  const payload = {
    model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
    temperature: 0.3,
    stream: Boolean(stream),
    messages: [
      {
        role: "system",
        content:
          "You are a website assistant. Use the provided context to answer. If the answer is not in the context, say you could not find it on the site.",
      },
      { role: "system", content: `Context:\n${context || "No context available."}` },
      ...(Array.isArray(messages) ? messages : []),
    ],
  };

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      res.status(500).json({ error: `Groq error: ${await response.text()}` });
      return;
    }

    if (payload.stream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");

      const reader = response.body?.getReader();
      if (!reader) {
        res.write(`data: ${JSON.stringify({ token: "" })}\n\n`);
        res.write("data: [DONE]\n\n");
        res.end();
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) {
            continue;
          }
          const data = trimmed.replace(/^data:\s*/, "");
          if (data === "[DONE]") {
            res.write("data: [DONE]\n\n");
            res.end();
            return;
          }
          try {
            const payloadData = JSON.parse(data) as {
              choices?: Array<{ delta?: { content?: string } }>;
            };
            const token = payloadData.choices?.[0]?.delta?.content;
            if (token) {
              res.write(`data: ${JSON.stringify({ token })}\n\n`);
            }
          } catch {
            // Ignore parse errors.
          }
        }
      }

      res.write("data: [DONE]\n\n");
      res.end();
      return;
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    res.status(200).json({ content: data.choices?.[0]?.message?.content?.trim() ?? "" });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
}
