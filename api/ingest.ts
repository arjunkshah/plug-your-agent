type DocPage = {
  url: string;
  title: string;
  wordCount: number;
};

type DocStore = {
  url: string;
  chunks: string[];
  pages: DocPage[];
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

const extractTitle = (html: string) => {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match?.[1]?.trim() ?? "";
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

const extractLinks = (html: string, baseUrl: string) => {
  const links: string[] = [];
  const regex = /href=["']([^"']+)["']/gi;
  let match = regex.exec(html);
  while (match) {
    const raw = match[1].trim();
    if (!raw || raw.startsWith("#") || raw.startsWith("mailto:") || raw.startsWith("tel:")) {
      match = regex.exec(html);
      continue;
    }
    if (raw.startsWith("javascript:")) {
      match = regex.exec(html);
      continue;
    }
    try {
      const resolved = new URL(raw, baseUrl).toString();
      links.push(resolved);
    } catch (_error) {
      // Ignore invalid URLs.
    }
    match = regex.exec(html);
  }
  return links;
};

const parseRobots = (robotsTxt: string) => {
  const disallows: string[] = [];
  let allowAll = true;
  let applies = false;
  const lines = robotsTxt.split(/\r?\n/);
  lines.forEach((line) => {
    const cleaned = line.split("#")[0].trim();
    if (!cleaned) {
      return;
    }
    const [directive, valueRaw] = cleaned.split(":");
    if (!directive) {
      return;
    }
    const value = valueRaw?.trim() ?? "";
    if (directive.toLowerCase() === "user-agent") {
      applies = value === "*" || value === "\"*\"";
      return;
    }
    if (applies && directive.toLowerCase() === "disallow") {
      if (value) {
        disallows.push(value);
        allowAll = false;
      }
    }
  });
  return { disallows, allowAll };
};

const isAllowedByRobots = (url: string, disallows: string[], allowAll: boolean) => {
  if (allowAll) {
    return true;
  }
  const path = new URL(url).pathname;
  return !disallows.some((rule) => (rule === "/" ? true : path.startsWith(rule)));
};

const isHtmlResponse = (contentType: string | null) =>
  contentType ? contentType.includes("text/html") : true;

const normalizeUrl = (raw: string) => {
  try {
    return new URL(raw).toString();
  } catch (_error) {
    return new URL(`https://${raw}`).toString();
  }
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

  const { url, depth, maxPages, siteKey, force } = req.body ?? {};
  if (!url || typeof url !== "string") {
    res.status(400).json({ error: "Missing url" });
    return;
  }

  try {
    const normalizedUrl = normalizeUrl(url);
    const depthLimit = Number.isFinite(depth) ? Math.max(0, Number(depth)) : 1;
    const maxLimit = Number.isFinite(maxPages) ? Math.max(1, Number(maxPages)) : 15;
    const cacheKey =
      siteKey && typeof siteKey === "string" ? siteKey : new URL(normalizedUrl).hostname;

    if (!force && store.has(cacheKey)) {
      const cached = store.get(cacheKey);
      res.status(200).json({ ok: true, cached: true, pages: cached?.pages?.length ?? 0 });
      return;
    }

    const urls: string[] = [];
    const visited = new Set<string>();
    const queue: Array<{ url: string; depth: number }> = [{ url: normalizedUrl, depth: 0 }];

    const sitemapUrl = new URL("/sitemap.xml", normalizedUrl).toString();
    let robots = { disallows: [] as string[], allowAll: true };

    try {
      const robotsResponse = await fetch(new URL("/robots.txt", normalizedUrl).toString(), {
        headers: {
          "User-Agent": "AgentPluginBar/1.0",
        },
      });
      if (robotsResponse.ok) {
        robots = parseRobots(await robotsResponse.text());
      }
    } catch (_error) {
      // Ignore robots failures.
    }

    try {
      const sitemapResponse = await fetch(sitemapUrl, {
        headers: {
          "User-Agent": "AgentPluginBar/1.0",
        },
      });
      if (sitemapResponse.ok) {
        const sitemapXml = await sitemapResponse.text();
        const sitemapUrls = extractSitemapUrls(sitemapXml).slice(0, maxLimit);
        sitemapUrls.forEach((entry) => {
          queue.push({ url: entry, depth: 0 });
        });
      }
    } catch (_error) {
      // Ignore sitemap failures.
    }

    const texts: string[] = [];
    const pages: DocPage[] = [];
    const origin = new URL(normalizedUrl).origin;

    while (queue.length && urls.length < maxLimit) {
      const next = queue.shift();
      if (!next) {
        break;
      }
      if (next.depth > depthLimit) {
        continue;
      }
      if (visited.has(next.url)) {
        continue;
      }
      if (!next.url.startsWith(origin)) {
        continue;
      }
      if (!isAllowedByRobots(next.url, robots.disallows, robots.allowAll)) {
        continue;
      }

      visited.add(next.url);

      let response: Response | null = null;
      try {
        response = await fetch(next.url, {
          headers: {
            "User-Agent": "AgentPluginBar/1.0",
          },
        });
      } catch (_error) {
        continue;
      }

      if (!response.ok) {
        continue;
      }

      if (!isHtmlResponse(response.headers.get("content-type"))) {
        continue;
      }

      const html = await response.text();
      const text = stripHtml(html);
      if (text) {
        texts.push(text);
        urls.push(next.url);
        pages.push({
          url: next.url,
          title: extractTitle(html),
          wordCount: text.split(/\s+/).length,
        });
      }

      if (next.depth < depthLimit) {
        extractLinks(html, next.url).forEach((link) => {
          if (!visited.has(link) && link.startsWith(origin)) {
            queue.push({ url: link, depth: next.depth + 1 });
          }
        });
      }
    }

    const combinedText = texts.join(" ");
    const chunks = chunkText(combinedText).slice(0, 200);

    store.set(cacheKey, {
      url: normalizedUrl,
      chunks,
      pages,
      updatedAt: Date.now(),
    });

    res.status(200).json({ ok: true, chunks: chunks.length, pages: pages.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: message });
  }
}
