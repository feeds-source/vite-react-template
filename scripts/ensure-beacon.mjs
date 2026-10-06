#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";

const token = process.env.CLOUDFLARE_API_TOKEN;
const account = process.env.CLOUDFLARE_ACCOUNT_ID || "1e611220afd75688b509ba299e98bde7";
const host = "www.silkmoments.com";
const htmlPath = "index.html";

function warn(msg) {
  console.warn(`beacon: ${msg}`);
}

if (!token) {
  warn("no Cloudflare token; beacon not installed");
  process.exit(0);
}

async function cf(path, init) {
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, data };
}

function sitesFrom(data) {
  const result = data?.result;
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.sites)) return result.sites;
  return [];
}

function matches(site) {
  const hosts = [
    site.host,
    site.ruleset?.zone_name,
    ...(site.rules ?? []).map((r) => r.host),
  ]
    .filter(Boolean)
    .map((h) => String(h).replace(/^https?:\/\//, "").replace(/\/$/, ""));
  return hosts.some((h) => h === host || h === "silkmoments.com" || h.endsWith(".silkmoments.com"));
}

let site = null;
const listed = await cf("/rum/site_info/list");
if (listed.ok) site = sitesFrom(listed.data).find(matches) ?? null;
else warn(`list failed (${listed.status})`);

if (!site) {
  const created = await cf("/rum/site_info", {
    method: "POST",
    body: JSON.stringify({ host, auto_install: false }),
  });
  if (!created.ok) {
    warn(`create failed (${created.status})`);
    process.exit(0);
  }
  site = created.data?.result ?? null;
}

const siteToken = site?.site_token;
if (!siteToken) {
  warn("site has no token");
  process.exit(0);
}

let html = readFileSync(htmlPath, "utf8");
if (html.includes("static.cloudflareinsights.com/beacon.min.js")) {
  console.log("beacon: already in index.html");
  process.exit(0);
}

const snippet =
  site.snippet && String(site.snippet).includes("beacon.min.js")
    ? String(site.snippet).trim()
    : `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":${JSON.stringify(siteToken)}}'></script>`;

const marker = "<!-- cf-beacon -->";
if (html.includes(marker)) html = html.replace(marker, snippet);
else html = html.replace("</body>", `\t\t${snippet}\n\t</body>`);
writeFileSync(htmlPath, html);
console.log(`beacon: installed for ${host}`);
