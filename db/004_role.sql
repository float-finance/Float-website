-- The waitlist no longer uses Privy sign-in: the form collects the email directly.
-- Rows saved under sign-in keep their privy_id; new rows have none, so the table gets its
-- own key and one entry per email instead.
ALTER TABLE waitlist_entries DROP CONSTRAINT IF EXISTS waitlist_entries_pkey;
ALTER TABLE waitlist_entries ADD COLUMN IF NOT EXISTS id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY;
ALTER TABLE waitlist_entries ALTER COLUMN privy_id DROP NOT NULL;
-- Emails are stored lowercased by the API, so a plain unique constraint is enough.
-- If this fails, an email already appears twice: remove the duplicate row, then rerun.
ALTER TABLE waitlist_entries ADD CONSTRAINT waitlist_entries_email_key UNIQUE (email);


-- The waitlist now asks whether someone is joining as a user or as a provider.
-- Nullable so rows saved before this question existed stay valid.
ALTER TABLE waitlist_entries ADD COLUMN IF NOT EXISTS role text
  CHECK (role IS NULL OR role IN ('user', 'provider'));
