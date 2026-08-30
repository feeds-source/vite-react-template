#!/usr/bin/env node
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

function setOutput(name, value) {
  if (!process.env.GITHUB_OUTPUT) return;
  appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
}

function pin(cfg, id) {
  if (!cfg.d1_databases?.[0]) {
    cfg.d1_databases = [
      {
        binding: "DB",
        database_name: "vite-react-db",
        database_id: id,
        migrations_dir: "migrations",
      },
    ];
  } else {
    cfg.d1_databases[0].database_name = "vite-react-db";
    cfg.d1_databases[0].database_id = id;
    cfg.d1_databases[0].binding = cfg.d1_databases[0].binding || "DB";
    cfg.d1_databases[0].migrations_dir = cfg.d1_databases[0].migrations_dir || "migrations";
  }
  saveConfig(cfg);
  setOutput("d1", "true");
  console.log(`Connected D1 vite-react-db (${id}) in wrangler.json`);
}

const who = wrangler(["whoami"]);
console.log(who);
const accountMatch = who.match(/\b([0-9a-f]{32})\b/);
const cfg = loadConfig();
if (accountMatch) {
  cfg.account_id = accountMatch[1];
  console.log(`Using Cloudflare account ${cfg.account_id}`);
}

const provided = (process.env.D1_DATABASE_ID || "").trim();
if (provided && !UUID.test(provided)) {
  throw new Error(`D1_DATABASE_ID is not a UUID: ${provided}`);
}

try {
  const listRaw = wrangler(["d1", "list", "--json"]);
  const jsonStart = listRaw.indexOf("[");
  if (jsonStart < 0) {
    throw new Error(`Could not parse D1 list output:\n${listRaw}`);
  }
  const rows = JSON.parse(listRaw.slice(jsonStart));
  const existing = rows.find((row) => row.name === "vite-react-db");
  let id = existing?.uuid || existing?.id || (UUID.test(provided) ? provided : "");

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

  pin(cfg, id);
} catch (err) {
  const output = err.output || err.message || String(err);
  console.log(output);
  if (provided && UUID.test(provided)) {
    console.warn(
      "::warning::D1 list failed; using D1_DATABASE_ID from GitHub to bind vite-react-db.",
    );
    pin(cfg, provided);
  } else {
    console.warn(
      "::warning::Cannot connect vite-react-db. Add GitHub secret D1_DATABASE_ID (the UUID from Cloudflare D1) and give CLOUDFLARE_API_TOKEN Account → D1 Edit.",
    );
    delete cfg.d1_databases;
    saveConfig(cfg);
    setOutput("d1", "false");
  }
}
