import type { DocPage } from "./_lib/db";
import { loadDatabase, normalizeUrl, resolveSiteKey, saveDatabase } from "./_lib/db";

const setCors = (res: any) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
};

const extractTitle = (html: string) => {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match?.[1]?.trim() ?? "";
};

const stripHtml = (html: string) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

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
      links.push(new URL(raw, baseUrl).toString());
    } catch {
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
  robotsTxt.split(/\r?\n/).forEach((line) => {
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
  const pathname = new URL(url).pathname;
  return !disallows.some((rule) => (rule === "/" ? true : pathname.startsWith(rule)));
};

const isHtmlResponse = (contentType: string | null) => (contentType ? contentType.includes("text/html") : true);

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

  const { url, depth, maxPages, siteKey, force, pageText, pageTitle, pageUrl } = req.body ?? {};
  const baseUrl =
    typeof url === "string" && url.trim()
      ? url
      : typeof pageUrl === "string" && pageUrl.trim()
        ? pageUrl
        : "";
  const hasSnapshot = typeof pageText === "string" && pageText.trim().length > 0;
  if (!baseUrl && !hasSnapshot) {
    res.status(400).json({ error: "Missing url" });
    return;
  }

  try {
    const normalizedUrl = baseUrl ? normalizeUrl(baseUrl) : "";
    const depthLimit = Number.isFinite(depth) ? Math.max(0, Number(depth)) : 1;
    const maxLimit = Number.isFinite(maxPages) ? Math.max(1, Number(maxPages)) : 15;
    const cacheKey =
      typeof siteKey === "string" && siteKey
        ? siteKey
        : resolveSiteKey(undefined, normalizedUrl || pageUrl || "");

    if (!cacheKey) {
      res.status(400).json({ error: "Missing site key" });
      return;
    }

    const db = await loadDatabase();
    const existing = !force ? db.docs.find((entry) => entry.siteKey === cacheKey) : undefined;
    const ownerSite = db.sites.find((entry) => entry.siteKey === cacheKey);
    const pages: DocPage[] = existing?.pages ? [...existing.pages] : [];
    const chunks: string[] = existing?.chunks ? [...existing.chunks] : [];

    if (hasSnapshot) {
      const cleaned = String(pageText).replace(/\s+/g, " ").trim();
      if (cleaned) {
        const snapshotUrl = pageUrl ? normalizeUrl(pageUrl) : normalizedUrl || cacheKey;
        if (!pages.some((page) => page.url === snapshotUrl)) {
          pages.unshift({
            url: snapshotUrl,
            title: typeof pageTitle === "string" ? pageTitle : "",
            wordCount: cleaned.split(/\s+/).length,
          });
        }
        chunks.unshift(...chunkText(cleaned, 140).slice(0, 20));
      }
    }

    if (!normalizedUrl) {
      const target = db.docs.find((entry) => entry.siteKey === cacheKey);
      if (target) {
        target.url = pageUrl ? normalizeUrl(pageUrl) : cacheKey;
        target.pages = pages;
        target.chunks = chunks.slice(0, 220);
        target.updatedAt = Date.now();
        target.ownerUserId = target.ownerUserId || ownerSite?.ownerUserId;
      } else {
        db.docs.push({
          siteKey: cacheKey,
          ownerUserId: ownerSite?.ownerUserId,
          url: pageUrl ? normalizeUrl(pageUrl) : cacheKey,
          chunks: chunks.slice(0, 220),
          pages,
          updatedAt: Date.now(),
        });
      }
      await saveDatabase(db);
      res.status(200).json({ ok: true, pages: pages.length, chunks: chunks.length });
      return;
    }

    if (!force && existing && !hasSnapshot) {
      res.status(200).json({ ok: true, cached: true, pages: existing.pages.length });
      return;
    }

    const urls: string[] = [];
    const visited = new Set<string>();
    const queue: Array<{ url: string; depth: number }> = [{ url: normalizedUrl, depth: 0 }];
    const sitemapUrl = new URL("/sitemap.xml", normalizedUrl).toString();
    let robots = { disallows: [] as string[], allowAll: true };

    try {
      const robotsResponse = await fetch(new URL("/robots.txt", normalizedUrl).toString(), {
        headers: { "User-Agent": "AgentPluginBar/1.0" },
      });
      if (robotsResponse.ok) {
        robots = parseRobots(await robotsResponse.text());
      }
    } catch {
      // Ignore robots failures.
    }

    try {
      const sitemapResponse = await fetch(sitemapUrl, {
        headers: { "User-Agent": "AgentPluginBar/1.0" },
      });
      if (sitemapResponse.ok) {
        extractSitemapUrls(await sitemapResponse.text())
          .slice(0, maxLimit)
          .forEach((entry) => {
            queue.push({ url: entry, depth: 0 });
          });
      }
    } catch {
      // Ignore sitemap failures.
    }

    const texts: string[] = [];
    const origin = new URL(normalizedUrl).origin;

    while (queue.length && urls.length < maxLimit) {
      const next = queue.shift();
      if (!next || next.depth > depthLimit || visited.has(next.url) || !next.url.startsWith(origin)) {
        continue;
      }
      if (!isAllowedByRobots(next.url, robots.disallows, robots.allowAll)) {
        continue;
      }
      visited.add(next.url);

      let response: Response | null = null;
      try {
        response = await fetch(next.url, { headers: { "User-Agent": "AgentPluginBar/1.0" } });
      } catch {
        continue;
      }
      if (!response.ok || !isHtmlResponse(response.headers.get("content-type"))) {
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

    const mergedChunks = [...chunks, ...chunkText(texts.join(" ")).slice(0, 200)].slice(0, 280);
    const now = Date.now();
    const target = db.docs.find((entry) => entry.siteKey === cacheKey);

    if (target) {
      target.url = normalizedUrl;
      target.pages = pages;
      target.chunks = mergedChunks;
      target.updatedAt = now;
      target.ownerUserId = target.ownerUserId || ownerSite?.ownerUserId;
    } else {
      db.docs.push({
        siteKey: cacheKey,
        ownerUserId: ownerSite?.ownerUserId,
        url: normalizedUrl,
        pages,
        chunks: mergedChunks,
        updatedAt: now,
      });
    }

    await saveDatabase(db);
    res.status(200).json({ ok: true, chunks: mergedChunks.length, pages: pages.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: message });
  }
}
