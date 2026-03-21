import { cleanupAuthState } from "../../_lib/auth";
import { loadDatabase, saveDatabase } from "../../_lib/db";

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

  const deviceCode = typeof req.body?.deviceCode === "string" ? req.body.deviceCode : "";
  if (!deviceCode) {
    res.status(400).json({ error: "Missing deviceCode" });
    return;
  }

  const db = await loadDatabase();
  cleanupAuthState(db);
  const device = db.devices.find((entry) => entry.deviceCode === deviceCode);
  if (!device) {
    await saveDatabase(db);
    res.status(404).json({ error: "Device code not found." });
    return;
  }

  if (!device.approvedAt || !device.accessToken || !device.userId) {
    await saveDatabase(db);
    res.status(200).json({ ok: true, approved: false });
    return;
  }

  const user = db.users.find((entry) => entry.id === device.userId);
  device.consumedAt = Date.now();
  const accessToken = device.accessToken;
  device.accessToken = undefined;
  await saveDatabase(db);

  res.status(200).json({
    ok: true,
    approved: true,
    accessToken,
    user: user
      ? {
          id: user.id,
          email: user.email,
        }
      : null,
  });
}
