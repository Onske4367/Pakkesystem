export type ItemKind = "equipment" | "consumable";
export type ProfileRole = "admin" | "standansvarlig";

export interface Category {
  id: string;
  name: string;
  created_at: string;
}

export interface Item {
  id: string;
  name: string;
  category_id: string | null;
  kind: ItemKind;
  unit: string | null;
  default_min_qty: number | null;
  default_supplier: string | null;
  created_at: string;
}

export interface EquipmentUnit {
  id: string;
  name: string;
  created_at: string;
}

export interface EquipmentUnitItem {
  id: string;
  equipment_unit_id: string;
  item_id: string;
  min_qty: number | null;
}

// Fysisk standstørrelse (Stand 3x3, Stand 3x6, Annen stand) — begrenset,
// enkel liste. Ikke å forveksle med Hovedelement (MainElement).
export interface StandType {
  id: string;
  name: string;
  created_at: string;
}

// Hovedelement: hva som selges/gjøres på standen (Sukkerspinn, Pinnevaffel,
// Slush...). Har kategori, obligatoriske elementer og trigger-regler.
export interface MainElement {
  id: string;
  name: string;
  category_id: string | null;
  created_at: string;
}

export interface MainElementMandatoryItem {
  id: string;
  main_element_id: string;
  item_id: string;
}

export type TriggerSourceType = "main_element" | "stand_type" | "item" | "category" | "equipment_unit";
export type TriggerTargetType = "item" | "equipment_unit";

export interface TriggerRule {
  id: string;
  source_main_element_id: string | null;
  source_stand_type_id: string | null;
  source_item_id: string | null;
  source_category_id: string | null;
  source_equipment_unit_id: string | null;
  target_item_id: string | null;
  target_equipment_unit_id: string | null;
  created_at: string;
}

export interface Event {
  id: string;
  name: string;
  arrangement_type: string | null;
  organizer_name: string | null;
  organizer_phone: string | null;
  organizer_email: string | null;
  date_from: string | null;
  date_to: string | null;
  location: string | null;
  notes: string | null;
  important_info: string | null;
  created_by: string | null;
  created_at: string;
}

export interface EventEvaluation {
  id: string;
  event_id: string;
  text: string;
  created_at: string;
}

export interface EventDocument {
  id: string;
  event_id: string;
  name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface Shift {
  id: string;
  event_id: string;
  shift_date: string;
  time_from: string | null;
  time_to: string | null;
  stand_responsible_name: string | null;
  notes: string | null;
  created_at: string;
}

export interface EventStand {
  id: string;
  event_id: string;
  main_element_id: string | null;
  stand_type_id: string | null;
  name_override: string | null;
  hygiene_responsible_name: string | null;
  created_at: string;
}

export interface EventStandItem {
  id: string;
  event_stand_id: string;
  item_id: string;
  qty: number | null;
  qty_confirmed: boolean;
  supplier: string | null;
  hentet_kjopt: boolean;
  hentet_kjopt_note: string | null;
  pakket: boolean;
  pakkes_i: string | null;
  returnert: boolean;
  returnert_note: string | null;
  rengjort: boolean;
  /** Hvilken utstyrsenhet elementet kom fra (for gruppering i pakkelisten). */
  source_equipment_unit_id: string | null;
}

export interface VolunteerNeed {
  id: string;
  event_id: string | null;
  shift_id: string | null;
  role: string;
  antall_onsket: number;
  notes: string | null;
  created_at: string;
}

export interface Volunteer {
  id: string;
  volunteer_need_id: string;
  name: string;
  phone: string;
  role_override: string | null;
  allergi_intoleranse: string | null;
  time_from: string | null;
  time_to: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  role: ProfileRole;
  created_at: string;
}

// Minimal Supabase Database-type — utvid med `supabase gen types typescript`
// når prosjektet er koblet til et ekte Supabase-prosjekt.
export type Database = Record<string, unknown>;
