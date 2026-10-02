create extension if not exists "pgcrypto";

create type project_status as enum ('Planning', 'Active', 'On Hold', 'Completed');
create type task_status as enum ('Not Started', 'In Progress', 'Completed');
create type scheduling_mode as enum ('auto', 'manual');
create type duration_unit as enum ('day');
create type dependency_type as enum ('FS', 'SS', 'FF', 'SF');

create table projects (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  description text not null default '',
  start_date date not null,
  target_end_date date,
  status project_status not null default 'Planning',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  description text not null default '',
  parent_task_id uuid references tasks(id) on delete cascade,
  sort_order integer not null,
  start_date date,
  finish_date date,
  duration integer not null default 1 check (duration >= 0),
  duration_unit duration_unit not null default 'day',
  progress integer not null default 0 check (progress between 0 and 100),
  status task_status not null default 'Not Started',
  milestone boolean not null default false,
  scheduling_mode scheduling_mode not null default 'auto',
  collapsed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint finish_after_start check (finish_date is null or start_date is null or finish_date >= start_date)
);

create table task_dependencies (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  predecessor_task_id uuid not null references tasks(id) on delete cascade,
  successor_task_id uuid not null references tasks(id) on delete cascade,
  type dependency_type not null default 'FS',
  lag integer not null default 0,
  created_at timestamptz not null default now(),
  constraint no_self_dependency check (predecessor_task_id <> successor_task_id),
  unique (predecessor_task_id, successor_task_id, type)
);

create index tasks_project_order_idx on tasks(project_id, sort_order);
create index tasks_parent_idx on tasks(parent_task_id);
create index task_dependencies_project_idx on task_dependencies(project_id);
create index task_dependencies_successor_idx on task_dependencies(successor_task_id);
create index task_dependencies_predecessor_idx on task_dependencies(predecessor_task_id);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger projects_set_updated_at
before update on projects
for each row execute procedure set_updated_at();

create trigger tasks_set_updated_at
before update on tasks
for each row execute procedure set_updated_at();

alter table projects enable row level security;
alter table tasks enable row level security;
alter table task_dependencies enable row level security;

create policy "single user projects access" on projects for all using (true) with check (true);
create policy "single user tasks access" on tasks for all using (true) with check (true);
create policy "single user dependencies access" on task_dependencies for all using (true) with check (true);
