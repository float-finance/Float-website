import postgres from "postgres";
import { createWaitlistHandler } from "../server/waitlist.mjs";

let client;
const db = () => (client ??= postgres(process.env.DATABASE_URL, { prepare: false, max: 1, idle_timeout: 20, connect_timeout: 10 }));
export default createWaitlistHandler({
  configured: () => Boolean(process.env.DATABASE_URL),
  save: async ({ email, role, business, socials }) => {
    await db()`INSERT INTO waitlist_entries (email, role, business, socials, consent_version)
      VALUES (${email}, ${role}, ${business}, ${socials}, 'early-access-v2')
      ON CONFLICT (email) DO NOTHING`;
  },
});
