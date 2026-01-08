import { serve } from "https://deno.land/std/http/server.ts";

const kv = await Deno.openKv();


function contentType(path) {
  if (path.endsWith(".html")) return "text/html; charset=utf-8";
  if (path.endsWith(".css")) return "text/css";
  if (path.endsWith(".js")) return "application/javascript";
  return "text/plain";
}


serve(async (req) => {
  const url = new URL(req.url);

  // ES 一覧取得
  if (req.method === "GET" && url.pathname === "/api/es") {
    const result = {};
    for await (const entry of kv.list({ prefix: ["es"] })) {
      result[entry.key[1]] = entry.value;
    }
    return Response.json(result);
  }

  // ES 保存
  if (req.method === "POST" && url.pathname === "/api/es") {
    const { title, text } = await req.json();

    const key = ["es", title];
    const res = await kv.get(key);
    const list = res.value ?? [];

    list.push({
      text,
      count: text.length,
      createdAt: new Date().toLocaleString(),
    });

    await kv.set(key, list);
    return new Response("saved");
  }

  // ES 更新
  if (req.method === "POST" && url.pathname === "/api/es/update") {
    const { title, index, text } = await req.json();
    const key = ["es", title];
    const res = await kv.get(key);

    if (!res.value || !res.value[index]) {
      return new Response("not found", { status: 404 });
    }

    res.value[index].text = text;
    res.value[index].count = text.length;

    await kv.set(key, res.value);
    return new Response("updated");
  }

  // ES 削除
  if (req.method === "POST" && url.pathname === "/api/es/delete") {
    const { title, index } = await req.json();
    const key = ["es", title];
    const res = await kv.get(key);

    if (!res.value) {
      return new Response("not found", { status: 404 });
    }

    res.value.splice(index, 1);
    if (res.value.length === 0) {
      await kv.delete(key);
    } else {
      await kv.set(key, res.value);
    }

    return new Response("deleted");
  }

  // 企業一覧取得
  if (req.method === "GET" && url.pathname === "/api/company") {
    const result = {};
    for await (const entry of kv.list({ prefix: ["company"] })) {
      result[entry.key[1]] = entry.value;
    }
    return Response.json(result);
  }

  // 企業情報保存
  if (req.method === "POST" && url.pathname === "/api/company") {
    const { company, status, date, memo } = await req.json();

    const key = ["company", company];
    const res = await kv.get(key);
    const list = res.value ?? [];

    list.push({
      status,
      date,
      memo,
      savedAt: new Date().toISOString(),
    });

    await kv.set(key, list);
    return new Response("saved");
  }
  
  // 静的ファイル配信
  let path = url.pathname;
  if (path === "/") path = "/kadai.html";

  try {
    const file = await Deno.readTextFile(`./public${path}`);
    return new Response(file, {
      headers: { "Content-Type": contentType(path) },
    });
  } catch {
    return new Response("Not Found", { status: 404 });
  }
});

