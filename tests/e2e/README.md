# Private-flow end-to-end check (local, no real Supabase)

`mock-supabase.mjs` serves the RPC endpoints the app calls, backed by PGlite running the real migration.

    node tests/e2e/mock-supabase.mjs &                       # port 54321
    SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_SERVICE_ROLE_KEY=x VAULT_PEPPER=p SESSION_SECRET=s \
      NEXT_PUBLIC_SITE_URL=http://localhost:3100 npm run build && npx next start -p 3100 &
    node --no-warnings tests/e2e/private-flow.ts             # run once per fresh mock (rate limits persist)
