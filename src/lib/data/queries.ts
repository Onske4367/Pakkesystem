import { createClient } from "@/lib/supabase/server";
import type {
  Category,
  Event,
  EventDocument,
  EventEvaluation,
  EventStand,
  EventStandItem,
  EquipmentUnit,
  EquipmentUnitItem,
  Item,
  MainElement,
  MainElementMandatoryItem,
  Shift,
  StandType,
  TriggerRule,
  Volunteer,
  VolunteerNeed,
} from "@/lib/types/database";
import type { PackingGraph } from "@/lib/packing/expand";

async function selectAll<T>(table: string, orderBy = "created_at"): Promise<T[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from(table).select("*").order(orderBy);
  if (error) throw new Error(`${table}: ${error.message}`);
  return (data ?? []) as T[];
}

export const getCategories = () => selectAll<Category>("categories", "name");
export const getItems = () => selectAll<Item>("items", "name");
export const getEquipmentUnits = () => selectAll<EquipmentUnit>("equipment_units", "name");
export const getEquipmentUnitItems = () => selectAll<EquipmentUnitItem>("equipment_unit_items", "id");
export const getStandTypes = () => selectAll<StandType>("stand_types", "name");
export const getMainElements = () => selectAll<MainElement>("main_elements", "name");
export const getMainElementMandatoryItems = () =>
  selectAll<MainElementMandatoryItem>("main_element_mandatory_items", "id");
export const getTriggerRules = () => selectAll<TriggerRule>("trigger_rules", "id");
export const getEvents = () => selectAll<Event>("events", "date_from");

export async function getPackingGraph(): Promise<PackingGraph> {
  const [
    categories,
    items,
    equipmentUnits,
    equipmentUnitItems,
    mainElements,
    mainElementMandatoryItems,
    standTypes,
    triggerRules,
  ] = await Promise.all([
    getCategories(),
    getItems(),
    getEquipmentUnits(),
    getEquipmentUnitItems(),
    getMainElements(),
    getMainElementMandatoryItems(),
    getStandTypes(),
    getTriggerRules(),
  ]);
  return {
    categories,
    items,
    equipmentUnits,
    equipmentUnitItems,
    mainElements,
    mainElementMandatoryItems,
    standTypes,
    triggerRules,
  };
}

export async function getEvent(id: string): Promise<Event | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data as Event | null;
}

export async function getShiftsForEvent(eventId: string): Promise<Shift[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shifts")
    .select("*")
    .eq("event_id", eventId)
    .order("shift_date")
    .order("time_from");
  if (error) throw new Error(error.message);
  return (data ?? []) as Shift[];
}

export async function getEventStands(eventId: string): Promise<EventStand[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_stands")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at");
  if (error) throw new Error(error.message);
  return (data ?? []) as EventStand[];
}

export async function getEventStand(id: string): Promise<EventStand | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("event_stands").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data as EventStand | null;
}

export async function getEventStandItems(eventStandId: string): Promise<EventStandItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_stand_items")
    .select("*")
    .eq("event_stand_id", eventStandId);
  if (error) throw new Error(error.message);
  return (data ?? []) as EventStandItem[];
}

export async function getVolunteerNeedsForEvent(eventId: string): Promise<VolunteerNeed[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("volunteer_needs")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at");
  if (error) throw new Error(error.message);
  return (data ?? []) as VolunteerNeed[];
}

export async function getVolunteerNeedsForShift(shiftId: string): Promise<VolunteerNeed[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("volunteer_needs")
    .select("*")
    .eq("shift_id", shiftId)
    .order("created_at");
  if (error) throw new Error(error.message);
  return (data ?? []) as VolunteerNeed[];
}

export async function getVolunteersForNeed(volunteerNeedId: string): Promise<Volunteer[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("volunteers")
    .select("*")
    .eq("volunteer_need_id", volunteerNeedId)
    .order("created_at");
  if (error) throw new Error(error.message);
  return (data ?? []) as Volunteer[];
}

export async function getEventDocuments(eventId: string): Promise<EventDocument[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_documents")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at");
  if (error) throw new Error(error.message);
  return (data ?? []) as EventDocument[];
}

export async function getEventEvaluations(eventId: string): Promise<EventEvaluation[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_evaluations")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at");
  if (error) throw new Error(error.message);
  return (data ?? []) as EventEvaluation[];
}
