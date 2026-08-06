-- Ønsketransporten pakkesystem — initial schema

create extension if not exists "pgcrypto";

-- ── Grunndata ─────────────────────────────────────────────────────────────

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table items (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category_id uuid references categories(id) on delete set null,
  kind text not null check (kind in ('equipment', 'consumable')),
  unit text,
  default_min_qty numeric,
  default_supplier text,
  created_at timestamptz not null default now()
);

create table equipment_units (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table equipment_unit_items (
  id uuid primary key default gen_random_uuid(),
  equipment_unit_id uuid not null references equipment_units(id) on delete cascade,
  item_id uuid not null references items(id) on delete cascade,
  min_qty numeric,
  unique (equipment_unit_id, item_id)
);

-- ── Standtyper ────────────────────────────────────────────────────────────

create table stand_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category_id uuid references categories(id) on delete set null,
  created_at timestamptz not null default now()
);

create table stand_type_mandatory_items (
  id uuid primary key default gen_random_uuid(),
  stand_type_id uuid not null references stand_types(id) on delete cascade,
  item_id uuid not null references items(id) on delete cascade,
  unique (stand_type_id, item_id)
);

-- Generell trigger-regel: kilde (standtype/item/kategori) -> mål (item/utstyrsenhet).
-- Nøyaktig én kildekolonne og én målkolonne skal være satt.
create table trigger_rules (
  id uuid primary key default gen_random_uuid(),
  source_stand_type_id uuid references stand_types(id) on delete cascade,
  source_item_id uuid references items(id) on delete cascade,
  source_category_id uuid references categories(id) on delete cascade,
  target_item_id uuid references items(id) on delete cascade,
  target_equipment_unit_id uuid references equipment_units(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint one_source check (
    num_nonnulls(source_stand_type_id, source_item_id, source_category_id) = 1
  ),
  constraint one_target check (
    num_nonnulls(target_item_id, target_equipment_unit_id) = 1
  )
);

-- ── Arrangementer ─────────────────────────────────────────────────────────

create table events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  arrangement_type text,
  organizer_name text,
  organizer_phone text,
  organizer_email text,
  date_from date,
  date_to date,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table shifts (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  shift_date date not null,
  time_from time,
  time_to time,
  stand_responsible_name text,
  notes text,
  created_at timestamptz not null default now()
);

create table event_stands (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  stand_type_id uuid not null references stand_types(id) on delete restrict,
  name_override text,
  -- Navngitt hygieneansvarlig, kreves i UI når standtypens kategori er Fødevare.
  hygiene_responsible_name text,
  created_at timestamptz not null default now()
);

create table event_stand_items (
  id uuid primary key default gen_random_uuid(),
  event_stand_id uuid not null references event_stands(id) on delete cascade,
  item_id uuid not null references items(id) on delete restrict,
  qty numeric,
  qty_confirmed boolean not null default false,
  supplier text,
  hentet_kjopt boolean not null default false,
  hentet_kjopt_note text,
  pakket boolean not null default false,
  pakkes_i text,
  returnert boolean not null default false,
  returnert_note text,
  rengjort boolean not null default false,
  unique (event_stand_id, item_id)
);

create table volunteer_needs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  shift_id uuid references shifts(id) on delete cascade,
  role text not null,
  antall_onsket int not null default 1,
  notes text,
  created_at timestamptz not null default now(),
  constraint one_scope check (num_nonnulls(event_id, shift_id) = 1)
);

create table volunteers (
  id uuid primary key default gen_random_uuid(),
  volunteer_need_id uuid not null references volunteer_needs(id) on delete cascade,
  name text not null,
  phone text not null,
  role_override text,
  created_at timestamptz not null default now()
);

-- ── Brukerprofiler ────────────────────────────────────────────────────────

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'standansvarlig' check (role in ('admin', 'standansvarlig')),
  created_at timestamptz not null default now()
);

-- Opprett profil automatisk når en bruker registreres
create function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ── Row Level Security ────────────────────────────────────────────────────
-- Internt team-verktøy: alle innloggede brukere har full lese/skrive-tilgang.
-- Rolleskillet (admin/standansvarlig) i `profiles` brukes kun til å styre
-- hvilke sider/knapper som vises i UI, ikke til databasenivå-restriksjon.

alter table categories enable row level security;
alter table items enable row level security;
alter table equipment_units enable row level security;
alter table equipment_unit_items enable row level security;
alter table stand_types enable row level security;
alter table stand_type_mandatory_items enable row level security;
alter table trigger_rules enable row level security;
alter table events enable row level security;
alter table shifts enable row level security;
alter table event_stands enable row level security;
alter table event_stand_items enable row level security;
alter table volunteer_needs enable row level security;
alter table volunteers enable row level security;
alter table profiles enable row level security;

create policy "authenticated full access" on categories for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on items for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on equipment_units for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on equipment_unit_items for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on stand_types for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on stand_type_mandatory_items for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on trigger_rules for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on events for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on shifts for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on event_stands for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on event_stand_items for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on volunteer_needs for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access" on volunteers for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "read own profile" on profiles for select using (auth.role() = 'authenticated');
create policy "update own profile" on profiles for update using (auth.uid() = id);
