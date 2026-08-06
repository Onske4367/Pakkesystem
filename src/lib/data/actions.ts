"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { expandEventStand } from "@/lib/packing/expand";
import { getPackingGraph } from "@/lib/data/queries";
import type { EventDocument, EventEvaluation } from "@/lib/types/database";

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function nullableStr(formData: FormData, key: string): string | null {
  const v = str(formData, key);
  return v.length ? v : null;
}

function nullableNum(formData: FormData, key: string): number | null {
  const v = str(formData, key);
  if (!v.length) return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

// ── Auth ────────────────────────────────────────────────────────────────

export async function signIn(formData: FormData) {
  const pin = str(formData, "pin");
  const appPin = process.env.APP_PIN;

  if (!appPin) {
    redirect(`/login?error=${encodeURIComponent("APP_PIN er ikke konfigurert")}`);
  }
  if (pin !== appPin) {
    redirect(`/login?error=${encodeURIComponent("Feil PIN-kode")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: process.env.SHARED_EMAIL!,
    password: process.env.SHARED_PASSWORD!,
  });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  redirect("/events");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// ── Kategorier ────────────────────────────────────────────────────────────

export async function createCategory(formData: FormData) {
  const supabase = await createClient();
  const name = str(formData, "name");
  if (!name) return;
  const { error } = await supabase.from("categories").insert({ name });
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

// ── Items ─────────────────────────────────────────────────────────────────

export async function createItem(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("items").insert({
    name: str(formData, "name"),
    category_id: nullableStr(formData, "category_id"),
    kind: str(formData, "kind") || "equipment",
    unit: nullableStr(formData, "unit"),
    default_min_qty: nullableNum(formData, "default_min_qty"),
    default_supplier: nullableStr(formData, "default_supplier"),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/items");
}

export async function deleteItem(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("items").delete().eq("id", str(formData, "id"));
  if (error) throw new Error(error.message);
  revalidatePath("/items");
}

const ITEM_TEXT_FIELDS = new Set(["unit", "default_supplier"]);

export async function updateItemField(formData: FormData) {
  const supabase = await createClient();
  const id = str(formData, "id");
  const field = str(formData, "field");

  let update: Record<string, unknown>;
  if (field === "default_min_qty") {
    update = { default_min_qty: nullableNum(formData, "value") };
  } else if (ITEM_TEXT_FIELDS.has(field)) {
    update = { [field]: nullableStr(formData, "value") };
  } else {
    throw new Error(`Ukjent felt: ${field}`);
  }

  const { error } = await supabase.from("items").update(update).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/items");
}

// ── Utstyrsenheter ──────────────────────────────────────────────────────────

export async function createEquipmentUnit(formData: FormData) {
  const supabase = await createClient();
  const name = str(formData, "name");
  if (!name) return;
  const { error } = await supabase.from("equipment_units").insert({ name });
  if (error) throw new Error(error.message);
  revalidatePath("/units");
}

export async function renameEquipmentUnit(formData: FormData) {
  const supabase = await createClient();
  const id = str(formData, "id");
  const name = str(formData, "value");
  if (!name) return;
  const { error } = await supabase.from("equipment_units").update({ name }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/units");
  revalidatePath(`/units/${id}`);
}

export async function deleteEquipmentUnit(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("equipment_units")
    .delete()
    .eq("id", str(formData, "id"));
  if (error) throw new Error(error.message);
  revalidatePath("/units");
}

export async function addEquipmentUnitItem(formData: FormData) {
  const supabase = await createClient();
  const equipmentUnitId = str(formData, "equipment_unit_id");
  const { error } = await supabase.from("equipment_unit_items").insert({
    equipment_unit_id: equipmentUnitId,
    item_id: str(formData, "item_id"),
    min_qty: nullableNum(formData, "min_qty"),
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/units/${equipmentUnitId}`);
}

export async function updateEquipmentUnitItemQty(formData: FormData) {
  const supabase = await createClient();
  const equipmentUnitId = str(formData, "equipment_unit_id");
  const { error } = await supabase
    .from("equipment_unit_items")
    .update({ min_qty: nullableNum(formData, "value") })
    .eq("id", str(formData, "id"));
  if (error) throw new Error(error.message);
  revalidatePath(`/units/${equipmentUnitId}`);
}

export async function removeEquipmentUnitItem(formData: FormData) {
  const supabase = await createClient();
  const equipmentUnitId = str(formData, "equipment_unit_id");
  const { error } = await supabase
    .from("equipment_unit_items")
    .delete()
    .eq("id", str(formData, "id"));
  if (error) throw new Error(error.message);
  revalidatePath(`/units/${equipmentUnitId}`);
}

// ── Standtyper (fysisk: Stand 3x3 / Stand 3x6 / Annen stand) ────────────────

export async function createStandType(formData: FormData) {
  const supabase = await createClient();
  const name = str(formData, "name");
  if (!name) return;
  const { error } = await supabase.from("stand_types").insert({ name });
  if (error) throw new Error(error.message);
  revalidatePath("/standtyper");
}

export async function deleteStandType(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("stand_types").delete().eq("id", str(formData, "id"));
  if (error) throw new Error(error.message);
  revalidatePath("/standtyper");
}

// ── Hovedelementer (Sukkerspinn, Pinnevaffel, Slush...) ─────────────────────

export async function createMainElement(formData: FormData) {
  const supabase = await createClient();
  const name = str(formData, "name");
  if (!name) return;
  const { data, error } = await supabase
    .from("main_elements")
    .insert({ name, category_id: nullableStr(formData, "category_id") })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  redirect(`/hovedelementer/${data.id}`);
}

export async function updateMainElementCategory(formData: FormData) {
  const supabase = await createClient();
  const mainElementId = str(formData, "main_element_id");
  const { error } = await supabase
    .from("main_elements")
    .update({ category_id: nullableStr(formData, "category_id") })
    .eq("id", mainElementId);
  if (error) throw new Error(error.message);
  revalidatePath(`/hovedelementer/${mainElementId}`);
}

export async function deleteMainElement(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("main_elements").delete().eq("id", str(formData, "id"));
  if (error) throw new Error(error.message);
  revalidatePath("/hovedelementer");
}

export async function addMandatoryItem(formData: FormData) {
  const supabase = await createClient();
  const mainElementId = str(formData, "main_element_id");
  const { error } = await supabase.from("main_element_mandatory_items").insert({
    main_element_id: mainElementId,
    item_id: str(formData, "item_id"),
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/hovedelementer/${mainElementId}`);
}

export async function removeMandatoryItem(formData: FormData) {
  const supabase = await createClient();
  const mainElementId = str(formData, "main_element_id");
  const { error } = await supabase
    .from("main_element_mandatory_items")
    .delete()
    .eq("id", str(formData, "id"));
  if (error) throw new Error(error.message);
  revalidatePath(`/hovedelementer/${mainElementId}`);
}

export async function createTriggerRule(formData: FormData) {
  const supabase = await createClient();
  const mainElementId = nullableStr(formData, "return_to_main_element_id");
  const standTypeId = nullableStr(formData, "return_to_stand_type_id");
  const equipmentUnitId = nullableStr(formData, "return_to_equipment_unit_id");
  const sourceType = str(formData, "source_type");
  const targetType = str(formData, "target_type");

  const row: Record<string, string | null> = {
    source_main_element_id: null,
    source_stand_type_id: null,
    source_item_id: null,
    source_category_id: null,
    source_equipment_unit_id: null,
    target_item_id: null,
    target_equipment_unit_id: null,
  };
  if (sourceType === "main_element") row.source_main_element_id = str(formData, "source_id");
  if (sourceType === "stand_type") row.source_stand_type_id = str(formData, "source_id");
  if (sourceType === "item") row.source_item_id = str(formData, "source_id");
  if (sourceType === "category") row.source_category_id = str(formData, "source_id");
  if (sourceType === "equipment_unit") row.source_equipment_unit_id = str(formData, "source_id");
  if (targetType === "item") row.target_item_id = str(formData, "target_id");
  if (targetType === "equipment_unit") row.target_equipment_unit_id = str(formData, "target_id");

  const { error } = await supabase.from("trigger_rules").insert(row);
  if (error) throw new Error(error.message);
  if (mainElementId) revalidatePath(`/hovedelementer/${mainElementId}`);
  if (standTypeId) revalidatePath(`/standtyper/${standTypeId}`);
  if (equipmentUnitId) revalidatePath(`/units/${equipmentUnitId}`);
  revalidatePath("/hovedelementer");
  revalidatePath("/standtyper");
  revalidatePath("/units");
}

export async function deleteTriggerRule(formData: FormData) {
  const supabase = await createClient();
  const mainElementId = nullableStr(formData, "return_to_main_element_id");
  const standTypeId = nullableStr(formData, "return_to_stand_type_id");
  const equipmentUnitId = nullableStr(formData, "return_to_equipment_unit_id");
  const { error } = await supabase.from("trigger_rules").delete().eq("id", str(formData, "id"));
  if (error) throw new Error(error.message);
  if (mainElementId) revalidatePath(`/hovedelementer/${mainElementId}`);
  if (standTypeId) revalidatePath(`/standtyper/${standTypeId}`);
  if (equipmentUnitId) revalidatePath(`/units/${equipmentUnitId}`);
  revalidatePath("/hovedelementer");
  revalidatePath("/standtyper");
  revalidatePath("/units");
}

// ── Arrangementer ─────────────────────────────────────────────────────────

export async function createEvent(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("events")
    .insert({
      name: str(formData, "name"),
      arrangement_type: nullableStr(formData, "arrangement_type"),
      organizer_name: nullableStr(formData, "organizer_name"),
      organizer_phone: nullableStr(formData, "organizer_phone"),
      organizer_email: nullableStr(formData, "organizer_email"),
      date_from: nullableStr(formData, "date_from"),
      date_to: nullableStr(formData, "date_to"),
      location: nullableStr(formData, "location"),
      notes: nullableStr(formData, "notes"),
      important_info: nullableStr(formData, "important_info"),
      created_by: user?.id ?? null,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  redirect(`/events/${data.id}`);
}

export async function updateEvent(formData: FormData) {
  const supabase = await createClient();
  const eventId = str(formData, "id");
  const { error } = await supabase
    .from("events")
    .update({
      name: str(formData, "name"),
      arrangement_type: nullableStr(formData, "arrangement_type"),
      organizer_name: nullableStr(formData, "organizer_name"),
      organizer_phone: nullableStr(formData, "organizer_phone"),
      organizer_email: nullableStr(formData, "organizer_email"),
      date_from: nullableStr(formData, "date_from"),
      date_to: nullableStr(formData, "date_to"),
      location: nullableStr(formData, "location"),
      notes: nullableStr(formData, "notes"),
      important_info: nullableStr(formData, "important_info"),
    })
    .eq("id", eventId);
  if (error) throw new Error(error.message);
  revalidatePath(`/events/${eventId}`);
}

export async function createShift(formData: FormData) {
  const supabase = await createClient();
  const eventId = str(formData, "event_id");
  const { error } = await supabase.from("shifts").insert({
    event_id: eventId,
    shift_date: str(formData, "shift_date"),
    time_from: nullableStr(formData, "time_from"),
    time_to: nullableStr(formData, "time_to"),
    stand_responsible_name: nullableStr(formData, "stand_responsible_name"),
    notes: nullableStr(formData, "notes"),
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/events/${eventId}`);
}

export async function updateShift(formData: FormData) {
  const supabase = await createClient();
  const eventId = str(formData, "event_id");
  const { error } = await supabase
    .from("shifts")
    .update({
      shift_date: str(formData, "shift_date"),
      time_from: nullableStr(formData, "time_from"),
      time_to: nullableStr(formData, "time_to"),
      stand_responsible_name: nullableStr(formData, "stand_responsible_name"),
      notes: nullableStr(formData, "notes"),
    })
    .eq("id", str(formData, "id"));
  if (error) throw new Error(error.message);
  revalidatePath(`/events/${eventId}`);
}

export async function deleteShift(formData: FormData) {
  const supabase = await createClient();
  const eventId = str(formData, "event_id");
  const { error } = await supabase.from("shifts").delete().eq("id", str(formData, "id"));
  if (error) throw new Error(error.message);
  revalidatePath(`/events/${eventId}`);
}

export async function addEventStand(formData: FormData) {
  const supabase = await createClient();
  const eventId = str(formData, "event_id");
  const mainElementId = nullableStr(formData, "main_element_id");
  const standTypeId = nullableStr(formData, "stand_type_id");

  const { data: eventStand, error } = await supabase
    .from("event_stands")
    .insert({ event_id: eventId, main_element_id: mainElementId, stand_type_id: standTypeId })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const graph = await getPackingGraph();
  const { items } = expandEventStand({ mainElementId, standTypeId }, graph);

  if (items.length) {
    const { error: itemsError } = await supabase.from("event_stand_items").insert(
      items.map(({ item, suggestedQty, needsQtyConfirmation, sourceEquipmentUnitId }) => ({
        event_stand_id: eventStand.id,
        item_id: item.id,
        qty: suggestedQty,
        qty_confirmed: !needsQtyConfirmation,
        supplier: item.default_supplier,
        source_equipment_unit_id: sourceEquipmentUnitId,
      })),
    );
    if (itemsError) throw new Error(itemsError.message);
  }

  revalidatePath(`/events/${eventId}`);
  redirect(`/events/${eventId}/pakkeliste/${eventStand.id}`);
}

export async function updateHygieneResponsible(formData: FormData) {
  const supabase = await createClient();
  const eventStandId = str(formData, "event_stand_id");
  const { error } = await supabase
    .from("event_stands")
    .update({ hygiene_responsible_name: nullableStr(formData, "value") })
    .eq("id", eventStandId);
  if (error) throw new Error(error.message);
  revalidatePath(`/events/[id]/pakkeliste/${eventStandId}`, "page");
}

export async function addEventStandItem(formData: FormData) {
  const supabase = await createClient();
  const eventStandId = str(formData, "event_stand_id");
  const itemId = str(formData, "item_id");

  const { data: item, error: itemError } = await supabase
    .from("items")
    .select("*")
    .eq("id", itemId)
    .single();
  if (itemError) throw new Error(itemError.message);

  const needsQtyConfirmation = item.kind === "consumable";
  const { error } = await supabase.from("event_stand_items").upsert(
    {
      event_stand_id: eventStandId,
      item_id: itemId,
      qty: needsQtyConfirmation ? item.default_min_qty : null,
      qty_confirmed: !needsQtyConfirmation,
      supplier: item.default_supplier,
      source_equipment_unit_id: null,
    },
    { onConflict: "event_stand_id,item_id", ignoreDuplicates: true },
  );
  if (error) throw new Error(error.message);
  revalidatePath(`/events/[id]/pakkeliste/${eventStandId}`, "page");
}

export async function createAndAddEventStandItem(formData: FormData) {
  const supabase = await createClient();
  const eventStandId = str(formData, "event_stand_id");
  const kind = str(formData, "kind") || "equipment";
  const defaultMinQty = nullableNum(formData, "default_min_qty");
  const defaultSupplier = nullableStr(formData, "default_supplier");

  const { data: item, error: itemError } = await supabase
    .from("items")
    .insert({
      name: str(formData, "name"),
      kind,
      unit: nullableStr(formData, "unit"),
      default_min_qty: defaultMinQty,
      default_supplier: defaultSupplier,
    })
    .select("*")
    .single();
  if (itemError) throw new Error(itemError.message);

  const needsQtyConfirmation = kind === "consumable";
  const { error } = await supabase.from("event_stand_items").insert({
    event_stand_id: eventStandId,
    item_id: item.id,
    qty: needsQtyConfirmation ? defaultMinQty : null,
    qty_confirmed: !needsQtyConfirmation,
    supplier: defaultSupplier,
    source_equipment_unit_id: null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/items");
  revalidatePath(`/events/[id]/pakkeliste/${eventStandId}`, "page");
}

export async function removeEventStandItem(formData: FormData) {
  const supabase = await createClient();
  const eventStandId = str(formData, "event_stand_id");
  const { error } = await supabase.from("event_stand_items").delete().eq("id", str(formData, "id"));
  if (error) throw new Error(error.message);
  revalidatePath(`/events/[id]/pakkeliste/${eventStandId}`, "page");
}

export async function addEquipmentUnitToStand(formData: FormData) {
  const supabase = await createClient();
  const eventStandId = str(formData, "event_stand_id");
  const equipmentUnitId = str(formData, "equipment_unit_id");

  const { data: unitItems, error: unitError } = await supabase
    .from("equipment_unit_items")
    .select("item_id, min_qty, items(*)")
    .eq("equipment_unit_id", equipmentUnitId);
  if (unitError) throw new Error(unitError.message);
  if (!unitItems?.length) return;

  const rows = unitItems.map((ui) => {
    const item = ui.items as unknown as { kind: string; default_min_qty: number | null; default_supplier: string | null } | null;
    const needsQtyConfirmation = item?.kind === "consumable";
    return {
      event_stand_id: eventStandId,
      item_id: ui.item_id,
      qty: ui.min_qty ?? (needsQtyConfirmation ? item?.default_min_qty : null),
      qty_confirmed: !needsQtyConfirmation,
      supplier: item?.default_supplier ?? null,
      source_equipment_unit_id: equipmentUnitId,
    };
  });

  const { error } = await supabase
    .from("event_stand_items")
    .upsert(rows, { onConflict: "event_stand_id,item_id", ignoreDuplicates: true });
  if (error) throw new Error(error.message);
  revalidatePath(`/events/[id]/pakkeliste/${eventStandId}`, "page");
}

export async function removeEventStand(formData: FormData) {
  const supabase = await createClient();
  const eventId = str(formData, "event_id");
  const { error } = await supabase.from("event_stands").delete().eq("id", str(formData, "id"));
  if (error) throw new Error(error.message);
  revalidatePath(`/events/${eventId}`);
}

export async function updateEventStandItem(formData: FormData) {
  const supabase = await createClient();
  const eventStandId = str(formData, "event_stand_id");
  const id = str(formData, "id");
  const field = str(formData, "field");

  const boolFields = new Set(["hentet_kjopt", "pakket", "returnert", "rengjort", "qty_confirmed"]);
  const textFields = new Set(["pakkes_i", "supplier", "hentet_kjopt_note", "returnert_note"]);

  let update: Record<string, unknown>;
  if (field === "qty") {
    update = { qty: nullableNum(formData, "value"), qty_confirmed: true };
  } else if (boolFields.has(field)) {
    update = { [field]: str(formData, "value") === "true" };
  } else if (textFields.has(field)) {
    update = { [field]: nullableStr(formData, "value") };
  } else {
    throw new Error(`Ukjent felt: ${field}`);
  }

  const { error } = await supabase.from("event_stand_items").update(update).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/events`);
  revalidatePath(`/events/[id]/pakkeliste/${eventStandId}`, "page");
}

const GROUP_BOOL_FIELDS = new Set(["hentet_kjopt", "pakket", "returnert", "rengjort"]);

export async function updateEventStandItemsGroupField(formData: FormData) {
  const supabase = await createClient();
  const eventStandId = str(formData, "event_stand_id");
  const sourceEquipmentUnitId = str(formData, "source_equipment_unit_id");
  const field = str(formData, "field");
  if (!GROUP_BOOL_FIELDS.has(field)) throw new Error(`Ukjent felt: ${field}`);
  const value = str(formData, "value") === "true";

  let query = supabase.from("event_stand_items").update({ [field]: value }).eq("event_stand_id", eventStandId);
  query = sourceEquipmentUnitId
    ? query.eq("source_equipment_unit_id", sourceEquipmentUnitId)
    : query.is("source_equipment_unit_id", null);

  const { error } = await query;
  if (error) throw new Error(error.message);
  revalidatePath(`/events`);
  revalidatePath(`/events/[id]/pakkeliste/${eventStandId}`, "page");
}

// ── Frivillige ────────────────────────────────────────────────────────────

export async function createVolunteerNeed(formData: FormData) {
  const supabase = await createClient();
  const eventId = nullableStr(formData, "event_id");
  const shiftId = nullableStr(formData, "shift_id");
  const { error } = await supabase.from("volunteer_needs").insert({
    event_id: eventId,
    shift_id: shiftId,
    role: str(formData, "role"),
    antall_onsket: Number(str(formData, "antall_onsket") || "1"),
    notes: nullableStr(formData, "notes"),
  });
  if (error) throw new Error(error.message);
  if (eventId) revalidatePath(`/events/${eventId}`);
}

export async function deleteVolunteerNeed(formData: FormData) {
  const supabase = await createClient();
  const eventId = str(formData, "event_id");
  const { error } = await supabase.from("volunteer_needs").delete().eq("id", str(formData, "id"));
  if (error) throw new Error(error.message);
  revalidatePath(`/events/${eventId}`);
}

export async function addVolunteer(formData: FormData) {
  const supabase = await createClient();
  const eventId = str(formData, "event_id");
  const { error } = await supabase.from("volunteers").insert({
    volunteer_need_id: str(formData, "volunteer_need_id"),
    name: str(formData, "name"),
    phone: str(formData, "phone"),
    role_override: nullableStr(formData, "role_override"),
    allergi_intoleranse: nullableStr(formData, "allergi_intoleranse"),
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/events/${eventId}`);
}

export async function createVolunteerNeedForShifts(formData: FormData) {
  const supabase = await createClient();
  const eventId = str(formData, "event_id");
  const role = str(formData, "role");
  const antall = Number(str(formData, "antall_onsket") || "1");
  const shiftIds = formData.getAll("shift_ids[]").map(String).filter(Boolean);
  if (!role || !shiftIds.length) return;
  const rows = shiftIds.map((shiftId) => ({ shift_id: shiftId, role, antall_onsket: antall }));
  const { error } = await supabase.from("volunteer_needs").insert(rows);
  if (error) throw new Error(error.message);
  revalidatePath(`/events/${eventId}`);
}

export async function addVolunteerForMultipleShifts(formData: FormData) {
  const supabase = await createClient();
  const eventId = str(formData, "event_id");
  const name = str(formData, "name");
  const phone = str(formData, "phone");
  const allergi = nullableStr(formData, "allergi_intoleranse");
  const role = str(formData, "role") || "Generell frivillig";
  const shiftIds = formData.getAll("shift_ids[]").map(String).filter(Boolean);
  if (!name || !phone || !shiftIds.length) return;

  for (const shiftId of shiftIds) {
    const timeFrom = nullableStr(formData, `time_from_${shiftId}`);
    const timeTo = nullableStr(formData, `time_to_${shiftId}`);

    let { data: need } = await supabase
      .from("volunteer_needs")
      .select("id")
      .eq("shift_id", shiftId)
      .eq("role", role)
      .maybeSingle();

    if (!need) {
      const { data: newNeed, error: needError } = await supabase
        .from("volunteer_needs")
        .insert({ shift_id: shiftId, role, antall_onsket: 1 })
        .select("id")
        .single();
      if (needError) throw new Error(needError.message);
      need = newNeed;
    }

    const { error } = await supabase.from("volunteers").insert({
      volunteer_need_id: need.id,
      name,
      phone,
      allergi_intoleranse: allergi,
      time_from: timeFrom,
      time_to: timeTo,
    });
    if (error) throw new Error(error.message);
  }

  revalidatePath(`/events/${eventId}`);
}

export async function removeVolunteer(formData: FormData) {
  const supabase = await createClient();
  const eventId = str(formData, "event_id");
  const { error } = await supabase.from("volunteers").delete().eq("id", str(formData, "id"));
  if (error) throw new Error(error.message);
  revalidatePath(`/events/${eventId}`);
}

export async function updateVolunteerTime(formData: FormData) {
  const supabase = await createClient();
  const eventId = str(formData, "event_id");
  const { error } = await supabase
    .from("volunteers")
    .update({
      time_from: nullableStr(formData, "time_from"),
      time_to: nullableStr(formData, "time_to"),
    })
    .eq("id", str(formData, "id"));
  if (error) throw new Error(error.message);
  revalidatePath(`/events/${eventId}`);
}

// ── Arrangementsdokumenter ────────────────────────────────────────────────────

export async function saveEventDocument(
  eventId: string,
  filePath: string,
  name: string,
  fileSize: number,
  mimeType: string,
): Promise<EventDocument> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("event_documents")
    .insert({ event_id: eventId, file_path: filePath, name, file_size: fileSize, mime_type: mimeType, uploaded_by: user?.id ?? null })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath(`/events/${eventId}`);
  return data as EventDocument;
}

export async function deleteEventDocument(docId: string, filePath: string, eventId: string): Promise<void> {
  const supabase = await createClient();
  const { error: storageError } = await supabase.storage.from("event-documents").remove([filePath]);
  if (storageError) throw new Error(storageError.message);
  const { error } = await supabase.from("event_documents").delete().eq("id", docId);
  if (error) throw new Error(error.message);
  revalidatePath(`/events/${eventId}`);
}

// ── Evaluering ────────────────────────────────────────────────────────────────

export async function addEvaluationPoint(eventId: string, text: string): Promise<EventEvaluation> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_evaluations")
    .insert({ event_id: eventId, text })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath(`/events/${eventId}`);
  return data as EventEvaluation;
}

export async function deleteEvaluationPoint(id: string, eventId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("event_evaluations").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/events/${eventId}`);
}
