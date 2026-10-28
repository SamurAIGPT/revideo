-- Revid.ai Studio - Supabase Schema
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Video Projects Table
create table if not exists public.video_projects (
  id text primary key,
  title text not null default 'Untitled Video',
  prompt text,
  script text,
  aspect_ratio text default '9:16',
  duration_seconds integer default 30,
  voice text default 'marcus',
  caption_style text default 'hormozi',
  music_track text default 'lofi',
  music_volume numeric default 0.25,
  scenes jsonb not null default '[]'::jsonb,
  thumbnail_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Video Renders / Exports Table
create table if not exists public.video_renders (
  id uuid default uuid_generate_v4() primary key,
  project_id text references public.video_projects(id) on delete cascade,
  status text default 'completed',
  video_url text,
  duration_seconds numeric,
  file_size_bytes bigint,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS) - Public Read/Write for open micro-saas demo
alter table public.video_projects enable row level security;
alter table public.video_renders enable row level security;

create policy "Public access to video_projects"
  on public.video_projects
  for all
  using (true)
  with check (true);

create policy "Public access to video_renders"
  on public.video_renders
  for all
  using (true)
  with check (true);
