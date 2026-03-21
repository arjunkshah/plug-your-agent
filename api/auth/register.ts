import { cleanupAuthState, createSession, createUser, findUserByEmail, setSessionCookie } from "../_lib/auth";
import { loadDatabase, saveDatabase } from "../_lib/db";

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

  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  if (!email || !password || password.length < 8) {
    res.status(400).json({ error: "Email and password with at least 8 characters are required." });
    return;
  }

  const db = await loadDatabase();
  cleanupAuthState(db);

  if (findUserByEmail(db, email)) {
    res.status(409).json({ error: "Account already exists." });
    return;
  }

  const user = createUser(db, email, password);
  const { token } = createSession(db, user.id, "web");
  await saveDatabase(db);
  setSessionCookie(res, token);

  res.status(200).json({
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
    },
  });
}
