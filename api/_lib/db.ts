import { promises as fs } from "node:fs";
import path from "node:path";

export type DocPage = {
  url: string;
  title: string;
  wordCount: number;
};

export type DocRecord = {
  siteKey: string;
  ownerUserId?: string;
  url: string;
  chunks: string[];
  pages: DocPage[];
  updatedAt: number;
};

export type StoredSiteConfig = Record<string, unknown>;

export type SiteRecord = {
  siteKey: string;
  siteUrl: string;
  ownerUserId: string;
  config: StoredSiteConfig;
  createdAt: number;
  updatedAt: number;
};

export type UserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: number;
};

export type SessionRecord = {
  id: string;
  userId: string;
  tokenHash: string;
  type: "web" | "cli";
  createdAt: number;
  expiresAt: number;
};

export type DeviceRecord = {
  id: string;
  deviceCode: string;
  userCode: string;
  createdAt: number;
  expiresAt: number;
  approvedAt?: number;
  userId?: string;
  accessToken?: string;
  consumedAt?: number;
};

export type DatabaseShape = {
  users: UserRecord[];
  sessions: SessionRecord[];
  devices: DeviceRecord[];
  sites: SiteRecord[];
  docs: DocRecord[];
};

const DEFAULT_DB: DatabaseShape = {
  users: [],
  sessions: [],
  devices: [],
  sites: [],
  docs: [],
};

declare global {
  // eslint-disable-next-line no-var
  var __agentbarDatabaseCache: DatabaseShape | undefined;
  // eslint-disable-next-line no-var
  var __agentbarDatabaseWrite: Promise<void> | undefined;
}

const DB_FILE = process.env.AGENTBAR_DB_FILE || "/tmp/agentbar-db.json";

const cloneDb = (db: DatabaseShape): DatabaseShape =>
  JSON.parse(JSON.stringify(db)) as DatabaseShape;

const ensureShape = (value: unknown): DatabaseShape => {
  if (!value || typeof value !== "object") {
    return cloneDb(DEFAULT_DB);
  }
  const candidate = value as Partial<DatabaseShape>;
  return {
    users: Array.isArray(candidate.users) ? candidate.users : [],
    sessions: Array.isArray(candidate.sessions) ? candidate.sessions : [],
    devices: Array.isArray(candidate.devices) ? candidate.devices : [],
    sites: Array.isArray(candidate.sites) ? candidate.sites : [],
    docs: Array.isArray(candidate.docs) ? candidate.docs : [],
  };
};

const readFromDisk = async () => {
  try {
    const raw = await fs.readFile(DB_FILE, "utf8");
    return ensureShape(JSON.parse(raw));
  } catch {
    return cloneDb(DEFAULT_DB);
  }
};

const writeToDisk = async (db: DatabaseShape) => {
  const directory = path.dirname(DB_FILE);
  const tempPath = `${DB_FILE}.tmp`;
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(tempPath, JSON.stringify(db, null, 2), "utf8");
  await fs.rename(tempPath, DB_FILE);
};

export const loadDatabase = async () => {
  if (globalThis.__agentbarDatabaseCache) {
    return cloneDb(globalThis.__agentbarDatabaseCache);
  }
  const loaded = await readFromDisk();
  globalThis.__agentbarDatabaseCache = loaded;
  return cloneDb(loaded);
};

export const saveDatabase = async (db: DatabaseShape) => {
  globalThis.__agentbarDatabaseCache = cloneDb(db);
  const writeTask = (globalThis.__agentbarDatabaseWrite ?? Promise.resolve()).then(() =>
    writeToDisk(globalThis.__agentbarDatabaseCache!)
  );
  globalThis.__agentbarDatabaseWrite = writeTask.catch(() => undefined);
  await writeTask;
};

export const updateDatabase = async (updater: (db: DatabaseShape) => void | DatabaseShape) => {
  const current = await loadDatabase();
  const maybeNext = updater(current);
  const next = ensureShape(maybeNext ?? current);
  await saveDatabase(next);
  return cloneDb(next);
};

export const sanitizeConfig = (value: unknown) => {
  if (!value || typeof value !== "object") {
    return {};
  }
  return Object.fromEntries(Object.entries(value as Record<string, unknown>));
};

export const normalizeUrl = (raw: string) => {
  try {
    return new URL(raw).toString();
  } catch {
    return new URL(`https://${raw}`).toString();
  }
};

export const resolveSiteKey = (siteKey?: string, siteUrl?: string) => {
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
