-- AS Research — Phase 3: private research, share links, vault codes, rate limiting.
-- Access model: deny-by-default. RLS is on for every table with NO policies, and all
-- table/function privileges are revoked from anon/authenticated. Only the server
-- (service_role) can touch data, via the security-definer functions below.


create table public.private_researches (
  id uuid primary key default gen_random_uuid(),
  title_en text, title_ar text,
  summary_en text, summary_ar text,
  kind text not null check (kind in ('mdx', 'bundle')),
  content_en text, content_ar text,
  storage_path text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint private_researches_kind_content check (
    (kind = 'mdx' and (content_en is not null or content_ar is not null) and storage_path is null)
    or (kind = 'bundle' and storage_path is not null)
  )
);

create table public.private_share_links (
  id uuid primary key default gen_random_uuid(),
  research_id uuid not null references public.private_researches(id) on delete cascade,
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  access_count bigint not null default 0,
  last_accessed_at timestamptz
);
create index on public.private_share_links (research_id);

create table public.vault_codes (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique check (code_hash ~ '^[0-9a-f]{64}$'),
  private_share_link_id uuid not null references public.private_share_links(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz
);
create index on public.vault_codes (private_share_link_id);

create table public.access_attempts (
  key text not null,
  kind text not null check (kind in ('token', 'vault')),
  window_start timestamptz not null,
  attempts integer not null default 0,
  primary key (key, kind)
);

alter table public.private_researches enable row level security;
alter table public.private_share_links enable row level security;
alter table public.vault_codes enable row level security;
alter table public.access_attempts enable row level security;
-- Intentionally no policies: anon/authenticated can read and write nothing.

revoke all on public.private_researches, public.private_share_links,
  public.vault_codes, public.access_attempts from public, anon, authenticated;

-- A link is usable only if it exists, is not revoked and has not expired.
create or replace function public.link_is_live(l public.private_share_links)
returns boolean language sql stable
set search_path = public, pg_temp
as $$ select l.revoked_at is null and (l.expires_at is null or l.expires_at > now()) $$;

-- Rate limit: returns true when the attempt is allowed. Counts every attempt.
create or replace function public.check_rate_limit(p_key text, p_kind text, p_limit int, p_window_seconds int)
returns boolean language plpgsql security definer
set search_path = public, pg_temp
as $$
declare v_attempts int;
begin
  insert into public.access_attempts as a (key, kind, window_start, attempts)
  values (p_key, p_kind, now(), 1)
  on conflict (key, kind) do update set
    window_start = case when a.window_start <= now() - make_interval(secs => p_window_seconds) then now() else a.window_start end,
    attempts = case when a.window_start <= now() - make_interval(secs => p_window_seconds) then 1 else a.attempts + 1 end
  returning attempts into v_attempts;
  return v_attempts <= p_limit;
end $$;

-- Opens a share link by token hash. Atomically counts a successful open (unless p_count = false,
-- used for HEAD/prefetch). Returns zero rows for unknown, expired or revoked links.
create or replace function public.open_share_link(p_token_hash text, p_count boolean default true)
returns table (link_id uuid, research_id uuid, kind text, title_en text, title_ar text,
               summary_en text, summary_ar text, content_en text, content_ar text,
               storage_path text, created_at timestamptz)
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare l public.private_share_links;
begin
  select * into l from public.private_share_links where token_hash = p_token_hash for update;
  if not found or not public.link_is_live(l) then return; end if;
  if p_count then
    update public.private_share_links
       set access_count = access_count + 1, last_accessed_at = now() where id = l.id;
  end if;
  return query
    select l.id, r.id, r.kind, r.title_en, r.title_ar, r.summary_en, r.summary_ar,
           r.content_en, r.content_ar, r.storage_path, r.created_at
      from public.private_researches r where r.id = l.research_id;
end $$;

-- Vault: resolves a code hash to its share link id (zero rows if invalid, expired or revoked,
-- or if the underlying link is no longer live). Does not count; counting happens on open.
create or replace function public.resolve_vault_code(p_code_hash text)
returns uuid language plpgsql stable security definer
set search_path = public, pg_temp
as $$
declare v_link uuid;
begin
  select l.id into v_link
    from public.vault_codes c
    join public.private_share_links l on l.id = c.private_share_link_id
   where c.code_hash = p_code_hash
     and c.revoked_at is null and (c.expires_at is null or c.expires_at > now())
     and public.link_is_live(l);
  return v_link;
end $$;

-- Opens a link by id (used after a vault code was verified). Same counting rules.
create or replace function public.open_share_link_by_id(p_link_id uuid, p_count boolean default true)
returns table (link_id uuid, research_id uuid, kind text, title_en text, title_ar text,
               summary_en text, summary_ar text, content_en text, content_ar text,
               storage_path text, created_at timestamptz)
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare l public.private_share_links;
begin
  select * into l from public.private_share_links where id = p_link_id for update;
  if not found or not public.link_is_live(l) then return; end if;
  if p_count then
    update public.private_share_links
       set access_count = access_count + 1, last_accessed_at = now() where id = l.id;
  end if;
  return query
    select l.id, r.id, r.kind, r.title_en, r.title_ar, r.summary_en, r.summary_ar,
           r.content_en, r.content_ar, r.storage_path, r.created_at
      from public.private_researches r where r.id = l.research_id;
end $$;

-- Functions are callable by the server only.
revoke all on function public.link_is_live(public.private_share_links) from public, anon, authenticated;
revoke all on function public.check_rate_limit(text, text, int, int) from public, anon, authenticated;
revoke all on function public.open_share_link(text, boolean) from public, anon, authenticated;
revoke all on function public.resolve_vault_code(text) from public, anon, authenticated;
revoke all on function public.open_share_link_by_id(uuid, boolean) from public, anon, authenticated;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant usage on schema public to service_role;
    grant all on public.private_researches, public.private_share_links, public.vault_codes, public.access_attempts to service_role;
    grant execute on function public.link_is_live(public.private_share_links) to service_role;
    grant execute on function public.check_rate_limit(text, text, int, int) to service_role;
    grant execute on function public.open_share_link(text, boolean) to service_role;
    grant execute on function public.resolve_vault_code(text) to service_role;
    grant execute on function public.open_share_link_by_id(uuid, boolean) to service_role;
  end if;
end $$;
