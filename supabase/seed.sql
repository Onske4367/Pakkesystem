-- Engangs-seed: utstyrsenhetene fra "Pakkelsite stand.xlsx" (Hygiene enhet,
-- Tilbehørs enhet 1/2, Strøm enhet, Trekasse, Pappkasse 1) med items og
-- minimumsantall. Kjøres én gang mot en tom database.
--
-- Standtypene fra Ark1 (PINNEVAFFEL, SLUSH osv.) og kategorier (f.eks.
-- Fødevare) settes bevisst IKKE opp her — det gjøres i UI slik at
-- obligatoriske elementer og trigger-regler kan vurderes av bruker.

insert into items (name, kind, unit, default_min_qty) values
  ('Våtservietter', 'consumable', 'pakker', 3),
  ('Antibac / Sprit', 'consumable', 'flaske', 1),
  ('Hansker S', 'consumable', 'pakke', 1),
  ('Hansker M', 'consumable', 'pakke', 1),
  ('Hansker L', 'consumable', 'pakke', 1),
  ('Hansker XL', 'consumable', 'pakke', 1),
  ('Søppelposer blå', 'consumable', 'rull', 1),
  ('Søppelsekk stor', 'consumable', 'stk', 4),
  ('Kjøkkenspray', 'consumable', 'stk', 1),
  ('Kjøkken klut på rull', 'consumable', 'rull', 1),
  ('Plastter', 'consumable', 'pakke', 1),

  ('Tape', 'consumable', 'rull', 1),
  ('Strikk Rød', 'consumable', 'stk', 2),
  ('Strikk Gul', 'consumable', 'stk', 2),
  ('Strikk Grønn', 'consumable', 'stk', 2),
  ('Jekkestropp', 'equipment', 'stk', 6),
  ('Nylon tau', 'equipment', 'stk', 2),
  ('Strips', 'consumable', 'boks', 1),
  ('Klyper til bildene', 'equipment', 'pose', 1),
  ('Saks', 'equipment', 'stk', 2),
  ('Pengeboks med veksel', 'equipment', 'boks', 1),

  ('Kulepenner', 'consumable', 'stk', 10),
  ('Pins', 'consumable', 'stk', 10),
  ('Nøkkelbånd', 'consumable', 'stk', 10),
  ('Post-It', 'consumable', 'stk', 10),
  ('Brosjyrer', 'consumable', 'katastrofepakke', 1),

  ('Kabeltrommel 25 meter', 'equipment', 'stk', 2),
  ('Grenuttak', 'equipment', 'stk', 2),
  ('Strømpadde', 'equipment', 'stk', 1),

  ('Bilder og plakater', 'equipment', 'alle', null),
  ('Ullteppe', 'equipment', 'stk', 1),
  ('Lommevenn', 'consumable', 'stk', 5),
  ('Fla-Mongo', 'equipment', 'stk', 2),

  ('Tallerker', 'consumable', 'stk', 480),
  ('Servietter (kaffe)', 'consumable', 'stk', 300),
  ('Kaffekopper', 'consumable', 'stk', 220),
  ('Kaffe', 'consumable', 'kg', 1.5),
  ('Kaffefilter', 'consumable', 'stk', 50),
  ('Kaffekanner', 'equipment', 'stk', 3)
on conflict (name) do nothing;

insert into equipment_units (name) values
  ('Hygiene enhet'),
  ('Tilbehørs enhet 1'),
  ('Tilbehørs enhet 2'),
  ('Strøm enhet'),
  ('Trekasse'),
  ('Pappkasse 1')
on conflict (name) do nothing;

insert into equipment_unit_items (equipment_unit_id, item_id, min_qty)
select u.id, i.id, v.min_qty
from (values
  ('Hygiene enhet', 'Våtservietter', 3),
  ('Hygiene enhet', 'Antibac / Sprit', 1),
  ('Hygiene enhet', 'Hansker S', 1),
  ('Hygiene enhet', 'Hansker M', 1),
  ('Hygiene enhet', 'Hansker L', 1),
  ('Hygiene enhet', 'Hansker XL', 1),
  ('Hygiene enhet', 'Søppelposer blå', 1),
  ('Hygiene enhet', 'Søppelsekk stor', 4),
  ('Hygiene enhet', 'Kjøkkenspray', 1),
  ('Hygiene enhet', 'Kjøkken klut på rull', 1),
  ('Hygiene enhet', 'Plastter', 1),

  ('Tilbehørs enhet 1', 'Tape', 1),
  ('Tilbehørs enhet 1', 'Strikk Rød', 2),
  ('Tilbehørs enhet 1', 'Strikk Gul', 2),
  ('Tilbehørs enhet 1', 'Strikk Grønn', 2),
  ('Tilbehørs enhet 1', 'Jekkestropp', 6),
  ('Tilbehørs enhet 1', 'Nylon tau', 2),
  ('Tilbehørs enhet 1', 'Strips', 1),
  ('Tilbehørs enhet 1', 'Klyper til bildene', 1),
  ('Tilbehørs enhet 1', 'Saks', 2),
  ('Tilbehørs enhet 1', 'Pengeboks med veksel', 1),

  ('Tilbehørs enhet 2', 'Kulepenner', 10),
  ('Tilbehørs enhet 2', 'Pins', 10),
  ('Tilbehørs enhet 2', 'Nøkkelbånd', 10),
  ('Tilbehørs enhet 2', 'Post-It', 10),
  ('Tilbehørs enhet 2', 'Brosjyrer', 1),

  ('Strøm enhet', 'Kabeltrommel 25 meter', 2),
  ('Strøm enhet', 'Grenuttak', 2),
  ('Strøm enhet', 'Strømpadde', 1),

  ('Trekasse', 'Bilder og plakater', null),
  ('Trekasse', 'Ullteppe', 1),
  ('Trekasse', 'Lommevenn', 5),
  ('Trekasse', 'Fla-Mongo', 2),

  ('Pappkasse 1', 'Tallerker', 480),
  ('Pappkasse 1', 'Servietter (kaffe)', 300),
  ('Pappkasse 1', 'Kaffekopper', 220),
  ('Pappkasse 1', 'Kaffe', 1.5),
  ('Pappkasse 1', 'Kaffefilter', 50),
  ('Pappkasse 1', 'Kaffekanner', 3)
) as v(unit_name, item_name, min_qty)
join equipment_units u on u.name = v.unit_name
join items i on i.name = v.item_name
on conflict (equipment_unit_id, item_id) do nothing;

-- Foreslått startkategori for videre bruk i UI (f.eks. Sukkerspinn-eksempelet).
insert into categories (name) values ('Fødevare')
on conflict (name) do nothing;
