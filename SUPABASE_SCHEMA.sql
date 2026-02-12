-- ─────────────────────────────────────────────────────────────────────────────
-- ANCORALIS — Supabase Schema
-- Paste into Supabase > SQL Editor > Run
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Anchor Points (the "day shape" — soft time markers)
create table if not exists anchors (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null default 'default',
  label       text not null,           -- e.g. "Morning", "Afternoon", "Wind down"
  time        text not null,           -- HH:MM 24hr
  color       text default '#a78bfa',  -- per-anchor color
  note        text,                    -- biological rationale / description
  active      boolean default true,
  created_at  timestamptz default now()
);
create index if not exists anchors_user_idx on anchors(user_id);

-- 2. Shelf Items (visible layer — things that exist but vanish)
create table if not exists shelf_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null default 'default',
  text        text not null,
  due_time    text,                    -- optional HH:MM
  done        boolean default false,
  pinned      boolean default false,   -- pinned = always visible
  created_at  timestamptz default now()
);
create index if not exists shelf_items_user_idx on shelf_items(user_id, done, created_at desc);

-- 3. Check-in log (Kinetora responses)
create table if not exists checkin_log (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null default 'default',
  response    text not null check (response in ('intentional','redirect','dismissed')),
  anchor_id   uuid references anchors(id) on delete set null,
  note        text,                    -- optional free text at check-in
  fired_at    timestamptz default now()
);
create index if not exists checkin_log_user_idx on checkin_log(user_id, fired_at desc);

-- 4. Settings
create table if not exists settings (
  user_id       text primary key default 'default',
  sound_enabled boolean default true,
  theme         text default 'dark',
  day_start     text default '08:00',
  day_end       text default '22:00',
  updated_at    timestamptz default now()
);

-- 5. RLS (open — add real auth later)
alter table anchors      enable row level security;
alter table shelf_items  enable row level security;
alter table checkin_log  enable row level security;
alter table settings     enable row level security;

create policy "allow all" on anchors      for all using (true) with check (true);
create policy "allow all" on shelf_items  for all using (true) with check (true);
create policy "allow all" on checkin_log  for all using (true) with check (true);
create policy "allow all" on settings     for all using (true) with check (true);

-- 6. Realtime
alter publication supabase_realtime add table anchors;
alter publication supabase_realtime add table shelf_items;
