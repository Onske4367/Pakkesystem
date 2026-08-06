-- "Standtype" var opprinnelig brukt for både fysisk standstørrelse (Stand
-- 3x3/3x6) og hovedaktivitet/produkt (Sukkerspinn, Pinnevaffel...). Dette
-- skiller de to: gamle "stand_types" (med kategori, obligatoriske elementer
-- og trigger-regler) blir "main_elements" (hovedelement), og en ny, enkel
-- "stand_types"-tabell begrenses til fysiske standstørrelser.

alter table stand_types rename to main_elements;
alter table stand_type_mandatory_items rename to main_element_mandatory_items;
alter table main_element_mandatory_items rename column stand_type_id to main_element_id;
alter table trigger_rules rename column source_stand_type_id to source_main_element_id;
alter table event_stands rename column stand_type_id to main_element_id;

create table stand_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

alter table event_stands
  add column stand_type_id uuid references stand_types(id) on delete set null;

insert into stand_types (name) values ('Stand 3x3'), ('Stand 3x6'), ('Annen stand')
on conflict (name) do nothing;

alter table stand_types enable row level security;
create policy "authenticated full access" on stand_types for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Merk: hvis du fra før har en rad i "Hovedelementer" (tidligere
-- "Standtyper") som egentlig er en fysisk standstørrelse (f.eks. "Stand
-- 3x6"), er den nå havnet i main_elements-tabellen sammen med de ekte
-- hovedelementene (Sukkerspinn osv.). Slett den raden fra Hovedelementer-
-- siden i appen etter at du har kjørt dette skriptet — den fysiske "Stand
-- 3x6" finnes allerede ferdig opprettet i den nye Standtyper-siden.
