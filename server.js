import { serve } from "https://deno.land/std/http/server.ts";

const COMPANY_DB = "./db/rireki.json";

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

  if (req.method === "POST" && url.pathname === "/api/company") {
    const { company, status, date, memo } = await req.json();
    const data = readJSON(COMPANY_DB, {});

    if (!data[company]) {
      data[company] = [];
    }

    data[company].push({
      status,
      date,
      memo,
      time: new Date().toISOString()
    });

    writeJSON(COMPANY_DB, data);
    return new Response("saved");
  }

  if (req.method === "GET" && url.pathname === "/api/company") {
    const data = readJSON(COMPANY_DB, {});
    return Response.json(data);
  }

  return new Response("Not Found", { status: 404 });
});
