-- Supplemental tables used by Revideo's Prisma/PostgreSQL application.
-- Run `npx prisma db push` first so the NextAuth `User` table exists.

create table if not exists public.video_projects (
  id text primary key,
  user_id text references public."User"(id) on delete cascade,
  title text not null default 'Untitled Video',
  prompt text,
  script text,
  aspect_ratio text not null default '9:16',
  duration_seconds integer not null default 30,
  voice text not null default 'marcus',
  caption_style text not null default 'hormozi',
  music_track text not null default 'none',
  music_volume numeric not null default 0.25,
  scenes jsonb not null default '[]'::jsonb,
  thumbnail_url text,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

alter table public.video_projects
  add column if not exists user_id text references public."User"(id) on delete cascade;

alter table public.video_projects
  add column if not exists audio_track_data jsonb;

-- Older Prisma pushes used the quoted camelCase userId column. Preserve those owners.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'video_projects'
      and column_name = 'userId'
  ) then
    execute 'update public.video_projects set user_id = coalesce(user_id, "userId")';
    execute 'alter table public.video_projects drop column "userId"';
  end if;
end $$;

update public.video_projects
set aspect_ratio = coalesce(aspect_ratio, '9:16'),
    duration_seconds = coalesce(duration_seconds, 30),
    voice = coalesce(voice, 'marcus'),
    caption_style = coalesce(caption_style, 'hormozi'),
    music_track = coalesce(music_track, 'none'),
    music_volume = coalesce(music_volume, 0.25),
    scenes = coalesce(scenes, '[]'::jsonb)
where aspect_ratio is null
   or duration_seconds is null
   or voice is null
   or caption_style is null
   or music_track is null
   or music_volume is null
   or scenes is null;

alter table public.video_projects
  alter column aspect_ratio set not null,
  alter column duration_seconds set not null,
  alter column voice set not null,
  alter column caption_style set not null,
  alter column music_track set not null,
  alter column music_volume set not null,
  alter column music_track set default 'none';

create table if not exists public.video_renders (
  id text primary key,
  project_id text references public.video_projects(id) on delete cascade,
  user_id text references public."User"(id) on delete cascade,
  status text not null default 'completed',
  video_url text,
  duration_seconds numeric,
  file_size_bytes bigint,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

alter table public.video_renders
  add column if not exists user_id text references public."User"(id) on delete cascade;

alter table public.video_renders alter column id drop default;
alter table public.video_renders alter column id type text using id::text;

create table if not exists public.saved_videos (
  id text primary key,
  user_id text references public."User"(id) on delete cascade,
  video_id text not null,
  platform text not null default 'youtube',
  title text,
  cover_url text,
  views bigint not null default 0,
  likes bigint not null default 0,
  video_url text,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

create table if not exists public.credit_transactions (
  id text primary key,
  user_id text not null references public."User"(id) on delete cascade,
  amount integer not null,
  type text not null,
  reason text,
  balance_after integer,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

create table if not exists public.api_rate_limits (
  id text primary key,
  user_id text not null references public."User"(id) on delete cascade,
  route text not null,
  count integer not null default 0,
  expires_at timestamp with time zone not null
);

create index if not exists video_projects_user_updated_idx
  on public.video_projects(user_id, updated_at desc);
create index if not exists video_renders_project_idx
  on public.video_renders(project_id);
create index if not exists video_renders_user_idx
  on public.video_renders(user_id);
create index if not exists saved_videos_user_created_idx
  on public.saved_videos(user_id, created_at desc);
create index if not exists credit_transactions_user_created_idx
  on public.credit_transactions(user_id, created_at desc);
create index if not exists api_rate_limits_expires_idx
  on public.api_rate_limits(expires_at);

-- The application authenticates through NextAuth, not Supabase Auth. Keep
-- browser access denied; server requests use the PostgreSQL connection.
alter table public.video_projects enable row level security;
alter table public.video_renders enable row level security;
alter table public.saved_videos enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.api_rate_limits enable row level security;

drop policy if exists "Public access to video_projects" on public.video_projects;
drop policy if exists "Public access to video_renders" on public.video_renders;
