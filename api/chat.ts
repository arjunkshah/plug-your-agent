type DocStore = {
  url: string;
  chunks: string[];
  updatedAt: number;
};

declare global {
  // eslint-disable-next-line no-var
  var __agentbarStore: Map<string, DocStore> | undefined;
}

const store = globalThis.__agentbarStore ?? new Map<string, DocStore>();
globalThis.__agentbarStore = store;

const setCors = (res: any) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
};

const extractTerms = (text: string) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((term) => term.length > 2);
};

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

const buildContext = (chunks: string[], question: string) => {
  const terms = extractTerms(question);
  const ranked = chunks
    .map((chunk) => ({ chunk, score: scoreChunk(chunk, terms) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((item) => item.chunk);

  return ranked.join("\n\n---\n\n").slice(0, 4000);
};

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

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Missing GROQ_API_KEY" });
    return;
  }

  const { siteUrl, messages } = req.body ?? {};
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

  const key = new URL(siteUrl).hostname;
  const docStore = store.get(key);
  const context = docStore ? buildContext(docStore.chunks, userMessage) : "";

  const systemPrompt =
    "You are a website assistant. Use the provided context to answer. " +
    "If the answer is not in the context, say you could not find it on the site.";

  const payload = {
    model: "llama-3.1-8b-instant",
    temperature: 0.3,
    messages: [
      { role: "system", content: systemPrompt },
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
      const detail = await response.text();
      res.status(500).json({ error: `Groq error: ${detail}` });
      return;
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = data.choices?.[0]?.message?.content?.trim() ?? "";
    res.status(200).json({ content });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: message });
  }
}
