import { serve } from "https://deno.land/std/http/server.ts";

const COMPANY_DB = "./db/rireki.json";
const ES_DB = "./db/es.json";

//ES
function readJSON(path, defaultData) {
  try {
    return JSON.parse(Deno.readTextFileSync(path));
  } catch {
    return defaultData;
  }
}

function writeJSON(path, data) {
  Deno.writeTextFileSync(path, JSON.stringify(data, null, 2));
}

serve(async (req) => {
  const url = new URL(req.url);

  if (req.method === "GET" && url.pathname === "/api/es") {
    return Response.json(readJSON(ES_DB, {}));
  }

  if (req.method === "POST" && url.pathname === "/api/es") {
    const { title, text } = await req.json();
    const data = readJSON(ES_DB, {});

    if (!data[title]) data[title] = [];

    data[title].push({
      text,
      count: text.length,
      createdAt: new Date().toLocaleString(),
    });

    writeJSON(ES_DB, data);
    return new Response("saved");
  }

    if (req.method === "POST" && url.pathname === "/api/es/update") {
    const { title, index, text } = await req.json();
    const data = readJSON(ES_DB, {});

    if (!data[title] || !data[title][index]) {
      return new Response("not found", { status: 404 });
    }

    data[title][index].text = text;
    data[title][index].count = text.length;

    writeJSON(ES_DB, data);
    return new Response("updated");
  }

  if (req.method === "POST" && url.pathname === "/api/es/delete") {
    const { title, index } = await req.json();
    const data = readJSON(ES_DB, {});

    if (!data[title]) {
      return new Response("not found", { status: 404 });
    }

    data[title].splice(index, 1);
    if (data[title].length === 0) delete data[title];

    writeJSON(ES_DB, data);
    return new Response("deleted");
  }

//企業情報
  if (req.method === "GET" && url.pathname === "/api/company") {
    return Response.json(readJSON(COMPANY_DB, {}));
  }

  if (req.method === "POST" && url.pathname === "/api/company") {
    const { company, status, date, memo } = await req.json();
    const data = readJSON(COMPANY_DB, {});

    if (!data[company]) data[company] = [];
    data[company].push({
      status,
      date,
      memo,
      savedAt: new Date().toISOString(),
    });

    writeJSON(COMPANY_DB, data);
    return new Response("saved");
  }

  let path = url.pathname;
  if (path === "/") path = "/kadai.html";

  try {
    const file = await Deno.readTextFile(`./public${path}`);
    return new Response(file, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch {
    return new Response("Not Found", { status: 404 });
  }
});
