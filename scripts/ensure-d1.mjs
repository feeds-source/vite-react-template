#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

function wrangler(args) {
  const result = spawnSync("npx", ["wrangler", ...args], {
    encoding: "utf8",
    env: process.env,
  });
  const out = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  if (result.status !== 0) {
    const err = new Error(`wrangler ${args.join(" ")} failed (${result.status})`);
    err.output = out;
    throw err;
  }
  return out;
}

function loadConfig() {
  return JSON.parse(readFileSync("wrangler.json", "utf8"));
}

function saveConfig(cfg) {
  writeFileSync("wrangler.json", `${JSON.stringify(cfg, null, 2)}\n`);
}

const who = wrangler(["whoami"]);
console.log(who);
const accountMatch = who.match(/\b([0-9a-f]{32})\b/);
const cfg = loadConfig();
if (accountMatch) {
  cfg.account_id = accountMatch[1];
  console.log(`Using Cloudflare account ${cfg.account_id}`);
}

try {
  const listRaw = wrangler(["d1", "list", "--json"]);
  const jsonStart = listRaw.indexOf("[");
  if (jsonStart < 0) {
    throw new Error(`Could not parse D1 list output:\n${listRaw}`);
  }
  const rows = JSON.parse(listRaw.slice(jsonStart));
  const existing = rows.find((row) => row.name === "vite-react-db");
  let id = existing?.uuid || existing?.id;

  if (!id) {
    console.log("Creating D1 database vite-react-db");
    const created = wrangler(["d1", "create", "vite-react-db"]);
    console.log(created);
    const match = created.match(/database_id["'\s:=]+([0-9a-f-]{36})/i);
    if (!match) {
      throw new Error("Could not parse database_id from wrangler d1 create");
    }
    id = match[1];
  } else {
    console.log(`Using existing D1 vite-react-db ${id}`);
  }

  if (!cfg.d1_databases?.[0]) {
    throw new Error("wrangler.json missing d1_databases[0]");
  }
  cfg.d1_databases[0].database_id = id;
  saveConfig(cfg);
  console.log(`Pinned database_id ${id} in wrangler.json`);
} catch (err) {
  const output = err.output || err.message || String(err);
  console.log(output);
  console.warn(
    "::warning::D1 is not permitted on CLOUDFLARE_API_TOKEN. Deploying the Worker without a D1 binding. Recreate the token with Account → D1 Edit, then re-run.",
  );
  delete cfg.d1_databases;
  saveConfig(cfg);
}
