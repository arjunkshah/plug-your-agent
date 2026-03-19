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

const stripHtml = (html: string) => {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
};

const chunkText = (text: string, wordsPerChunk = 160) => {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += wordsPerChunk) {
    chunks.push(words.slice(i, i + wordsPerChunk).join(" "));
  }
  return chunks;
};

const extractSitemapUrls = (sitemapXml: string) => {
  const urls: string[] = [];
  const regex = /<loc>([^<]+)<\/loc>/gi;
  let match = regex.exec(sitemapXml);
  while (match) {
    urls.push(match[1]);
    match = regex.exec(sitemapXml);
  }
  return urls;
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

  const { url } = req.body ?? {};
  if (!url || typeof url !== "string") {
    res.status(400).json({ error: "Missing url" });
    return;
  }

  try {
    const urls = [url];
    const sitemapUrl = new URL("/sitemap.xml", url).toString();

    try {
      const sitemapResponse = await fetch(sitemapUrl, {
        headers: {
          "User-Agent": "AgentPluginBar/1.0",
        },
      });
      if (sitemapResponse.ok) {
        const sitemapXml = await sitemapResponse.text();
        const sitemapUrls = extractSitemapUrls(sitemapXml).slice(0, 12);
        sitemapUrls.forEach((entry) => {
          if (!urls.includes(entry)) {
            urls.push(entry);
          }
        });
      }
    } catch (_error) {
      // Ignore sitemap failures.
    }

    const texts: string[] = [];
    for (const pageUrl of urls.slice(0, 12)) {
      const response = await fetch(pageUrl, {
        headers: {
          "User-Agent": "AgentPluginBar/1.0",
        },
      });

      if (!response.ok) {
        continue;
      }

      const html = await response.text();
      const text = stripHtml(html);
      if (text) {
        texts.push(text);
      }
    }

    const combinedText = texts.join(" ");
    const chunks = chunkText(combinedText).slice(0, 160);
    const key = new URL(url).hostname;

    store.set(key, {
      url,
      chunks,
      updatedAt: Date.now(),
    });

    res.status(200).json({ ok: true, chunks: chunks.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: message });
  }
}
