/**
 * End-to-end test: add a Recurring (Weekend Cyclic) passcode to lock 33023772,
 * verify it shows in the TTLock passcode list, then clean it up.
 *
 * Prereqs:
 *   1. npm run dev        (from src/IDGuard)
 *   2. Log in once in the browser at http://localhost:3000/login
 *   3. Copy cookie values from DevTools → Application → Cookies:
 *        export TT_TOKEN=<tt_token> TT_REFRESH=<tt_refresh>
 *   4. node scripts/test-recurring-passcode.mjs
 */
const BASE = "http://localhost:3000";
const LOCK_ID = 33023772;

const tt = process.env.TT_TOKEN;
const rf = process.env.TT_REFRESH;
if (!tt || !rf) {
  console.error("Set TT_TOKEN and TT_REFRESH from your logged-in browser cookies first (see file header).");
  process.exit(1);
}
const cookie = `tt_token=${tt}; tt_refresh=${rf}`;

const post = (path, body) =>
  fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify(body),
  }).then((r) => r.json());

const testPass = `88${String(Date.now()).slice(-4)}`; // 6 digits, unique per run

console.log(`→ Adding Recurring (Weekend Cyclic, type 5) passcode ${testPass} to lock ${LOCK_ID}...`);
const add = await post("/api/passcodes", {
  action: "add",
  lockId: LOCK_ID,
  passcode: testPass,
  type: 5, // TTLock Weekend Cyclic
  startDate: Date.now(),
  endDate: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
  name: "Codebuff E2E Test",
});
console.log("  add response:", JSON.stringify(add));
if (!add.ok) {
  console.error("✗ Add failed — lock may be offline / no gateway reachable.");
  process.exit(1);
}
const pwdId = add.data?.keyboardPwdId;
console.log(`✓ Added, keyboardPwdId=${pwdId}`);

console.log("→ Verifying it appears in the passcode list...");
const list = await fetch(`${BASE}/api/passcodes?lockId=${LOCK_ID}`, { headers: { Cookie: cookie } }).then((r) => r.json());
const found = (list.data ?? []).find((p) => p.keyboardPwdId === pwdId);
console.log("  list entry:", JSON.stringify(found));
if (!found) {
  console.error("✗ Passcode not found in list!");
} else {
  console.log(`✓ Listed with keyboardPwdType=${found.keyboardPwdType} (expect 5), name=${found.nickName ?? "(none)"}`);
}

console.log("→ Cleaning up test passcode...");
const del = await post("/api/passcodes", { action: "delete", lockId: LOCK_ID, passcodeId: pwdId });
console.log("  delete response:", JSON.stringify(del));
console.log(del.ok ? "✓ Deleted — E2E test complete" : "⚠ Could not delete, remove it manually in the app");
