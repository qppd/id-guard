/**
 * Gateway E2E: exercise detail + rename (reversible) on the deployed site.
 * Transfer is intentionally NOT automated — TTLock transfers are permanent.
 *
 * Prereqs:
 *   1. Log in at https://slsu-id-guard.vercel.app/login
 *   2. DevTools → Application → Cookies → copy tt_token + tt_refresh
 *   3. export TT_TOKEN=<...> TT_REFRESH=<...> GW_ID=<gatewayId> BASE=https://slsu-id-guard.vercel.app
 *      (GW_ID is visible in the app's Gateways page rows)
 *   4. node scripts/test-gateway-flows.mjs
 */
const BASE = process.env.BASE || "https://slsu-id-guard.vercel.app";
const GW_ID = Number(process.env.GW_ID);
const tt = process.env.TT_TOKEN;
const rf = process.env.TT_REFRESH;
if (!tt || !rf || !GW_ID) {
  console.error("Set TT_TOKEN, TT_REFRESH and GW_ID first (see file header).");
  process.exit(1);
}
const cookie = `tt_token=${tt}; tt_refresh=${rf}`;

const get = (path) =>
  fetch(`${BASE}${path}`, { headers: { Cookie: cookie } }).then((r) => r.json());
const post = (path, body) =>
  fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify(body),
  }).then((r) => r.json());

// 1. DETAIL — the rebuilt route (no undocumented /v3/gateway/detail anymore)
console.log(`→ GET /api/gateways/detail?gatewayId=${GW_ID}`);
const detail = await get(`/api/gateways/detail?gatewayId=${GW_ID}`);
if (!detail.ok) {
  console.error("✗ detail failed:", detail.error || JSON.stringify(detail));
  process.exit(1);
}
const origName = detail.data.gatewayName || `Gateway #${GW_ID}`;
console.log(`✓ detail OK — name="${origName}" mac=${detail.data.gatewayMac} online=${detail.data.isOnline}`);

// 2. RENAME — revert at the end, so nothing is permanently changed
const testName = `${origName} (E2E)`;
console.log(`→ rename → "${testName}"`);
const ren = await post("/api/gateways/rename", { gatewayId: GW_ID, gatewayName: testName });
if (!ren.ok) {
  console.error("✗ rename failed:", ren.error || JSON.stringify(ren));
  process.exit(1);
}
console.log("✓ rename call OK");
const verify = await get(`/api/gateways/detail?gatewayId=${GW_ID}`);
const nowName = verify.ok ? verify.data.gatewayName : "(fetch failed)";
console.log(`  name after rename: "${nowName}" ${nowName === testName ? "✓" : "✗ (list cache may lag)"}`);

console.log(`→ reverting name → "${origName}"`);
const rev = await post("/api/gateways/rename", { gatewayId: GW_ID, gatewayName: origName });
console.log(rev.ok ? "✓ reverted — gateway unchanged" : `⚠ revert failed: ${rev.error} (rename back manually)`);

// 3. TRANSFER — manual only by design
console.log("\n➜ Transfer: run it from the app's Gateways page when you actually intend to move the gateway.");
console.log("  TTLock transfer is PERMANENT — there is no undo via the API.");
