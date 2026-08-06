-- Fysiske standtyper (Stand 3x3, Stand 3x6, Annen stand) skal også kunne
-- trigge elementer/utstyrsenheter (f.eks. Stand 3x3 -> Telt 3x3, alle
-- standtyper -> Strøm enhet). Utvider trigger_rules med en ny kildekolonne.

alter table trigger_rules add column source_stand_type_id uuid references stand_types(id) on delete cascade;

alter table trigger_rules drop constraint one_source;
alter table trigger_rules add constraint one_source check (
  num_nonnulls(source_main_element_id, source_item_id, source_category_id, source_stand_type_id) = 1
);

-- Husk hvilken utstyrsenhet (om noen) hvert element i en generert pakkeliste
-- kom fra, slik at pakkelistesiden kan gruppere elementene under en
-- kategorioverskrift (f.eks. "Hygienekasse").
alter table event_stand_items
  add column source_equipment_unit_id uuid references equipment_units(id) on delete set null;
