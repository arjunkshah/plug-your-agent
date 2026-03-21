import { clearSessionCookie, getAuthUser } from "../_lib/auth";
import { saveDatabase } from "../_lib/db";

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

  const { db, session } = await getAuthUser(req);
  if (session) {
    db.sessions = db.sessions.filter((entry) => entry.id !== session.id);
    await saveDatabase(db);
  }
  clearSessionCookie(res);
  res.status(200).json({ ok: true });
}
