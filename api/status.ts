type DocPage = {
  url: string;
  title: string;
  wordCount: number;
};

type DocStore = {
  url: string;
  chunks: string[];
  pages: DocPage[];
  updatedAt: number;
};

declare global {
  // eslint-disable-next-line no-var
  var __agentbarStore: Map<string, DocStore> | undefined;
}

const store = globalThis.__agentbarStore ?? new Map<string, DocStore>();
globalThis.__agentbarStore = store;

const setCors = (res: any) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
};

export default async function handler(req: any, res: any) {
  setCors(res);
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const items = Array.from(store.entries()).map(([key, value]) => ({
    key,
    url: value.url,
    pages: value.pages,
    chunkCount: value.chunks.length,
    updatedAt: value.updatedAt,
  }));

  res.status(200).json({
    ok: true,
    items,
  });
}
