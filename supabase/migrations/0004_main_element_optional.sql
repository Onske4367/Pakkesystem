-- En stand kan settes opp med kun fysisk standtype (f.eks. bare Stand 3x6
-- for Telt + Strøm) uten at et hovedelement er valgt ennå. Fjerner NOT NULL.

alter table event_stands alter column main_element_id drop not null;
