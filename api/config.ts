type WidgetConfig = Record<string, unknown>;

type ConfigStoreEntry = {
  config: WidgetConfig;
  updatedAt: number;
};

declare global {
  // eslint-disable-next-line no-var
  var __agentbarConfigStore: Map<string, ConfigStoreEntry> | undefined;
}

const store = globalThis.__agentbarConfigStore ?? new Map<string, ConfigStoreEntry>();
globalThis.__agentbarConfigStore = store;

const setCors = (res: any) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
};

const normalizeUrl = (raw: string) => {
  try {
    return new URL(raw).toString();
  } catch (_error) {
    return new URL(`https://${raw}`).toString();
  }
};

const resolveSiteKey = (siteKey?: string, siteUrl?: string) => {
  if (siteKey) {
    return siteKey;
  }
  if (!siteUrl) {
    return "";
  }
  try {
    return new URL(normalizeUrl(siteUrl)).hostname;
  } catch {
    return "";
  }
};

const toPlainObject = (value: unknown) => {
  if (!value || typeof value !== "object") {
    return {};
  }
  return Object.fromEntries(Object.entries(value as Record<string, unknown>));
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
    const entry = store.get(siteKey);
    if (!entry) {
      res.status(404).json({ error: "Config not found" });
      return;
    }
    res.status(200).json({ ok: true, config: entry.config, updatedAt: entry.updatedAt });
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const body = req.body ?? {};
  const payloadConfig =
    body && typeof body === "object" && "config" in body ? body.config : body;
  const safeConfig = toPlainObject(payloadConfig);

  const siteKey = resolveSiteKey(
    typeof body?.siteKey === "string" ? body.siteKey : undefined,
    typeof safeConfig.siteUrl === "string" ? safeConfig.siteUrl : undefined
  );

  if (!siteKey) {
    res.status(400).json({ error: "Missing siteKey or siteUrl" });
    return;
  }

  const entry: ConfigStoreEntry = {
    config: {
      ...safeConfig,
      siteKey,
    },
    updatedAt: Date.now(),
  };

  store.set(siteKey, entry);
  res.status(200).json({ ok: true, config: entry.config, updatedAt: entry.updatedAt });
}
