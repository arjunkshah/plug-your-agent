import { createDeviceCode, getRequestBaseUrl } from "../../_lib/auth";
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

  const db = await loadDatabase();
  const device = createDeviceCode(db);
  await saveDatabase(db);

  const baseUrl = getRequestBaseUrl(req);
  const verificationUrl = `${baseUrl}/?console=1&deviceCode=${encodeURIComponent(device.deviceCode)}`;

  res.status(200).json({
    ok: true,
    deviceCode: device.deviceCode,
    userCode: device.userCode,
    verificationUrl,
    expiresAt: device.expiresAt,
    interval: 2,
  });
}
