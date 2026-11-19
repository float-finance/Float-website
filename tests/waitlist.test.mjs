import test from "node:test";
import assert from "node:assert/strict";
import { createWaitlistHandler } from "../server/waitlist.mjs";
function harness(overrides = {}) {
  const records = new Map(); let writes = 0;
  const handler = createWaitlistHandler({ configured: () => true, save: async record => { writes++; if (!records.has(record.email)) records.set(record.email, record); }, log: () => {}, ...overrides });
  return { records, get writes() { return writes; }, async request(changes = {}) {
    const req = { method: "POST", headers: { "content-type": "application/json" }, body: { role: "user", business: " Ada Lovelace ", email: " Ada@Example.com ", socials: " @float ", website: "" }, ...changes };
    const res = { headers: {}, setHeader(k,v) { this.headers[k]=v; }, status(s) { this.code=s; return this; }, json(b) { this.body=b; return this; } };
    await handler(req,res); return res;
  } };
}
const valid = { role: "user", business: "Test Co", email: "test@example.com" };
test("saves the form trimmed, with the email lowercased", async () => { const h=harness(); assert.equal((await h.request()).code,200); assert.deepEqual(h.records.get("ada@example.com"),{email:"ada@example.com",role:"user",business:"Ada Lovelace",socials:"@float"}); });
test("ignores fields the form doesn't send", async () => { const h=harness(); assert.equal((await h.request({body:{...valid,privyId:"did:privy:x",community:true}})).code,200); assert.deepEqual(h.records.get("test@example.com"),{email:"test@example.com",role:"user",business:"Test Co",socials:null}); });
test("socials are optional and normalise to null", async () => { const h=harness(); for(const socials of [undefined,null,"","   "]){h.records.clear(); assert.equal((await h.request({body:{...valid,socials}})).code,200); assert.equal(h.records.get("test@example.com").socials,null);} });
test("requires a name", async () => { const h=harness(); for(const business of [undefined,"   ","x".repeat(161),42]){assert.equal((await h.request({body:{...valid,business}})).code,400);} assert.equal(h.writes,0); });
test("requires a valid email", async () => { const h=harness(); for(const email of [undefined,null,"","not-an-email","a@b","a b@example.com",`${"x".repeat(250)}@example.com`,42]){const res=await h.request({body:{...valid,email}}); assert.equal(res.code,400); assert.equal(res.body.code,"INVALID_EMAIL");} assert.equal(h.writes,0); });
test("requires a user or provider role", async () => { const h=harness(); for(const role of [undefined,null,"","admin","User"]){assert.equal((await h.request({body:{...valid,role}})).code,400);} assert.equal(h.writes,0); assert.equal((await h.request({body:{...valid,role:"provider"}})).code,200); assert.equal(h.records.get("test@example.com").role,"provider"); });
test("rejects oversized socials", async () => { const h=harness(); assert.equal((await h.request({body:{...valid,socials:"x".repeat(201)}})).code,400); assert.equal(h.writes,0); });
test("bots that fill the hidden field get a success but no row", async () => { const h=harness(); const res=await h.request({body:{...valid,website:"http://spam.example"}}); assert.equal(res.code,200); assert.equal(h.writes,0); });
test("only POST is accepted", async () => { const h=harness(); assert.equal((await h.request({method:"GET"})).code,405); assert.equal(h.writes,0); });
test("rejects malformed and oversized payloads",async()=>{const h=harness(); for(const body of [null,[],"{broken"]){assert.equal((await h.request({body})).code,400);}assert.equal((await h.request({body:"a".repeat(5000)})).code,413);assert.equal(h.writes,0);});
test("rejects non-JSON requests",async()=>{const h=harness();assert.equal((await h.request({headers:{"content-type":"text/plain"}})).code,415);assert.equal(h.writes,0);});
test("missing configuration never reports success",async()=>{const h=harness({configured:()=>false});assert.equal((await h.request()).code,503);assert.equal(h.writes,0);});
test("database failure never reports a saved place",async()=>{const h=harness({save:async()=>{throw new Error("timeout")}});const res=await h.request();assert.equal(res.code,503);assert.equal(res.body.ok,false);});
test("repeat submissions keep one record per email",async()=>{const h=harness();await Promise.all([h.request(),h.request({body:{...valid,email:"ADA@example.com"}}),h.request({body:{...valid,email:"ada@example.com"}})]);assert.equal(h.records.size,1);assert.equal(h.records.get("ada@example.com").business,"Ada Lovelace");});
