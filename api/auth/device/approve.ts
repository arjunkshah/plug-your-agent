import { cleanupAuthState, createSession, requireUser } from "../../_lib/auth";
import { saveDatabase } from "../../_lib/db";

const setCors = (res: any) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
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

  const auth = await requireUser(req, res);
  if (!auth) {
    return;
  }

  const deviceCode = typeof req.body?.deviceCode === "string" ? req.body.deviceCode : "";
  if (!deviceCode) {
    res.status(400).json({ error: "Missing deviceCode" });
    return;
  }

  const { db, user } = auth;
  cleanupAuthState(db);
  const device = db.devices.find((entry) => entry.deviceCode === deviceCode);
  if (!device) {
    await saveDatabase(db);
    res.status(404).json({ error: "Device code not found." });
    return;
  }

  const { token } = createSession(db, user.id, "cli");
  device.userId = user.id;
  device.approvedAt = Date.now();
  device.accessToken = token;
  await saveDatabase(db);

  res.status(200).json({ ok: true, approved: true });
}
