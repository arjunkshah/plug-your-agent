import crypto from "node:crypto";
import type { IncomingMessage } from "node:http";
import {
  loadDatabase,
  saveDatabase,
  type DatabaseShape,
  type SessionRecord,
  type UserRecord,
} from "./db";

const SESSION_COOKIE = "agentbar_session";
const WEB_SESSION_MS = 1000 * 60 * 60 * 24 * 14;
const CLI_SESSION_MS = 1000 * 60 * 60 * 24 * 30;
const DEVICE_MS = 1000 * 60 * 10;

const trimEmail = (value: string) => value.trim().toLowerCase();

const sha256 = (value: string) => crypto.createHash("sha256").update(value).digest("hex");

export const randomId = () => crypto.randomUUID();

export const hashPassword = (password: string) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
};

export const verifyPassword = (password: string, storedHash: string) => {
  const [salt, expected] = storedHash.split(":");
  if (!salt || !expected) {
    return false;
  }
  const actual = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(actual, "hex"));
};

export const parseCookies = (req: IncomingMessage) => {
  const header = req.headers.cookie || "";
  return Object.fromEntries(
    header
      .split(";")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const index = item.indexOf("=");
        if (index === -1) {
          return [item, ""];
        }
        return [decodeURIComponent(item.slice(0, index)), decodeURIComponent(item.slice(index + 1))];
      })
  );
};

export const getRequestBaseUrl = (req: IncomingMessage) => {
  const protoHeader = req.headers["x-forwarded-proto"];
  const proto = Array.isArray(protoHeader) ? protoHeader[0] : protoHeader || "https";
  const hostHeader = req.headers["x-forwarded-host"] || req.headers.host || "localhost:3000";
  const host = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader;
  return `${proto}://${host}`;
};

export const setSessionCookie = (res: any, token: string, maxAgeMs = WEB_SESSION_MS) => {
  const cookie = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Secure",
    `Max-Age=${Math.floor(maxAgeMs / 1000)}`,
  ].join("; ");
  res.setHeader("Set-Cookie", cookie);
};

export const clearSessionCookie = (res: any) => {
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0`
  );
};

export const cleanupAuthState = (db: DatabaseShape) => {
  const now = Date.now();
  db.sessions = db.sessions.filter((session) => session.expiresAt > now);
  db.devices = db.devices.filter((device) => device.expiresAt > now && !device.consumedAt);
};

export const createSession = (
  db: DatabaseShape,
  userId: string,
  type: "web" | "cli" = "web"
) => {
  const token = crypto.randomBytes(32).toString("hex");
  const session: SessionRecord = {
    id: randomId(),
    userId,
    tokenHash: sha256(token),
    type,
    createdAt: Date.now(),
    expiresAt: Date.now() + (type === "web" ? WEB_SESSION_MS : CLI_SESSION_MS),
  };
  db.sessions.push(session);
  return { token, session };
};

export const createDeviceCode = (db: DatabaseShape) => {
  const deviceCode = crypto.randomBytes(24).toString("hex");
  const rawUserCode = crypto.randomBytes(4).toString("hex").toUpperCase();
  const userCode = `${rawUserCode.slice(0, 4)}-${rawUserCode.slice(4, 8)}`;
  const record = {
    id: randomId(),
    deviceCode,
    userCode,
    createdAt: Date.now(),
    expiresAt: Date.now() + DEVICE_MS,
  };
  db.devices.push(record);
  return record;
};

export const findUserByEmail = (db: DatabaseShape, email: string) =>
  db.users.find((user) => user.email === trimEmail(email));

export const createUser = (db: DatabaseShape, email: string, password: string): UserRecord => {
  const user: UserRecord = {
    id: randomId(),
    email: trimEmail(email),
    passwordHash: hashPassword(password),
    createdAt: Date.now(),
  };
  db.users.push(user);
  return user;
};

export const getAuthUser = async (req: IncomingMessage) => {
  const db = await loadDatabase();
  cleanupAuthState(db);
  const cookies = parseCookies(req);
  const authHeader = req.headers.authorization || "";
  const bearer =
    typeof authHeader === "string" && authHeader.toLowerCase().startsWith("bearer ")
      ? authHeader.slice(7).trim()
      : "";
  const token = bearer || cookies[SESSION_COOKIE] || "";
  if (!token) {
    await saveDatabase(db);
    return { db, user: null, session: null };
  }
  const tokenHash = sha256(token);
  const session = db.sessions.find((entry) => entry.tokenHash === tokenHash) || null;
  const user = session ? db.users.find((entry) => entry.id === session.userId) || null : null;
  await saveDatabase(db);
  return { db, user, session };
};

export const requireUser = async (req: IncomingMessage, res: any) => {
  const { db, user, session } = await getAuthUser(req);
  if (!user || !session) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  return { db, user, session };
};
