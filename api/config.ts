import { requireUser } from "./_lib/auth";
import { loadDatabase, resolveSiteKey, sanitizeConfig, saveDatabase } from "./_lib/db";

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

  if (req.method === "GET") {
    const url = new URL(req.url ?? "", "http://localhost");
    const siteKey = url.searchParams.get("siteKey") || url.searchParams.get("key") || "";
    if (!siteKey) {
      res.status(400).json({ error: "Missing siteKey" });
      return;
    }

    const db = await loadDatabase();
    const site = db.sites.find((entry) => entry.siteKey === siteKey);
    if (!site) {
      res.status(404).json({ error: "Config not found" });
      return;
    }

    res.status(200).json({ ok: true, config: site.config, updatedAt: site.updatedAt });
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const auth = await requireUser(req, res);
  if (!auth) {
    return;
  }

  const body = req.body ?? {};
  const payloadConfig = body && typeof body === "object" && "config" in body ? body.config : body;
  const safeConfig = sanitizeConfig(payloadConfig);
  const siteUrl = typeof safeConfig.siteUrl === "string" ? safeConfig.siteUrl : "";
  const siteKey = resolveSiteKey(typeof body?.siteKey === "string" ? body.siteKey : undefined, siteUrl);

  if (!siteKey || !siteUrl) {
    res.status(400).json({ error: "Missing siteKey or siteUrl" });
    return;
  }

  const { db, user } = auth;
  const now = Date.now();
  const existing = db.sites.find((entry) => entry.siteKey === siteKey);
  if (existing && existing.ownerUserId !== user.id) {
    res.status(403).json({ error: "That site belongs to another account." });
    return;
  }

  if (existing) {
    existing.config = {
      ...existing.config,
      ...safeConfig,
      siteKey,
    };
    existing.siteUrl = siteUrl;
    existing.updatedAt = now;
  } else {
    db.sites.push({
      siteKey,
      siteUrl,
      ownerUserId: user.id,
      config: {
        ...safeConfig,
        siteKey,
      },
      createdAt: now,
      updatedAt: now,
    });
  }

  const doc = db.docs.find((entry) => entry.siteKey === siteKey);
  if (doc && !doc.ownerUserId) {
    doc.ownerUserId = user.id;
  }

  await saveDatabase(db);

  res.status(200).json({
    ok: true,
    config: db.sites.find((entry) => entry.siteKey === siteKey)?.config ?? {},
    updatedAt: now,
  });
}
