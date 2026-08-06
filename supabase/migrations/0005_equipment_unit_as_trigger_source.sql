-- En utstyrsenhet skal kunne trigges automatisk ikke bare av standtype,
-- hovedelement, kategori eller element, men også av at en ANNEN
-- utstyrsenhet velges/trigges (f.eks. satt opp fra selve enhetens egen
-- side: "denne enheten skal alltid følge med når [enhet X] velges").

alter table trigger_rules add column source_equipment_unit_id uuid references equipment_units(id) on delete cascade;

alter table trigger_rules drop constraint one_source;
alter table trigger_rules add constraint one_source check (
  num_nonnulls(source_main_element_id, source_item_id, source_category_id, source_stand_type_id, source_equipment_unit_id) = 1
);
