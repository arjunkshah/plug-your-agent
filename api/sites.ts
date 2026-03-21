import { requireUser } from "./_lib/auth";
import { resolveSiteKey, sanitizeConfig, saveDatabase } from "./_lib/db";

const setCors = (res: any) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
};

export default async function handler(req: any, res: any) {
  setCors(res);
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  const auth = await requireUser(req, res);
  if (!auth) {
    return;
  }

  const { db, user } = auth;

  if (req.method === "GET") {
    const items = db.sites
      .filter((site) => site.ownerUserId === user.id)
      .map((site) => {
        const doc = db.docs.find((entry) => entry.siteKey === site.siteKey);
        return {
          siteKey: site.siteKey,
          siteUrl: site.siteUrl,
          updatedAt: site.updatedAt,
          config: site.config,
          pageCount: doc?.pages.length ?? 0,
          chunkCount: doc?.chunks.length ?? 0,
        };
      });

    res.status(200).json({ ok: true, items });
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const payloadConfig =
    req.body && typeof req.body === "object" && "config" in req.body ? req.body.config : req.body;
  const safeConfig = sanitizeConfig(payloadConfig);
  const siteUrl = typeof safeConfig.siteUrl === "string" ? safeConfig.siteUrl : "";
  const siteKey = resolveSiteKey(
    typeof req.body?.siteKey === "string" ? req.body.siteKey : undefined,
    siteUrl
  );

  if (!siteKey || !siteUrl) {
    res.status(400).json({ error: "Missing siteUrl or siteKey." });
    return;
  }

  const existing = db.sites.find((site) => site.siteKey === siteKey);
  if (existing && existing.ownerUserId !== user.id) {
    res.status(403).json({ error: "That site belongs to another account." });
    return;
  }

  const now = Date.now();
  if (existing) {
    existing.siteUrl = siteUrl;
    existing.updatedAt = now;
    existing.config = { ...existing.config, ...safeConfig, siteKey };
  } else {
    db.sites.push({
      siteKey,
      siteUrl,
      ownerUserId: user.id,
      config: { ...safeConfig, siteKey },
      createdAt: now,
      updatedAt: now,
    });
  }

  const doc = db.docs.find((entry) => entry.siteKey === siteKey);
  if (doc && !doc.ownerUserId) {
    doc.ownerUserId = user.id;
  }

  await saveDatabase(db);
  res.status(200).json({ ok: true, siteKey });
}
