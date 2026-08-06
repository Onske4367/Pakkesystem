import type {
  Category,
  EquipmentUnit,
  EquipmentUnitItem,
  Item,
  MainElement,
  MainElementMandatoryItem,
  StandType,
  TriggerRule,
} from "@/lib/types/database";

export interface PackingGraph {
  categories: Category[];
  items: Item[];
  equipmentUnits: EquipmentUnit[];
  equipmentUnitItems: EquipmentUnitItem[];
  mainElements: MainElement[];
  mainElementMandatoryItems: MainElementMandatoryItem[];
  standTypes: StandType[];
  triggerRules: TriggerRule[];
}

export interface ExpandedPackingItem {
  item: Item;
  /** Forhåndsutfylt fra item.default_min_qty for forbruksvarer — må bekreftes i UI. */
  suggestedQty: number | null;
  needsQtyConfirmation: boolean;
  /** Utstyrsenheten elementet ble hentet fra, brukes til gruppering i pakkelisten. */
  sourceEquipmentUnitId: string | null;
}

export interface ExpandEventStandResult {
  items: ExpandedPackingItem[];
  /**
   * true når hovedelementets kategori er "Fødevare" (case-insensitive) — UI
   * skal da kreve at en navngitt Hygieneansvarlig settes på standen.
   */
  requiresHygieneResponsible: boolean;
}

export interface ExpandEventStandParams {
  mainElementId?: string | null;
  standTypeId?: string | null;
}

function itemTriggerTargets(rules: TriggerRule[], itemId: string): TriggerRule[] {
  return rules.filter((r) => r.source_item_id === itemId);
}

function mainElementTriggerTargets(rules: TriggerRule[], mainElementId: string): TriggerRule[] {
  return rules.filter((r) => r.source_main_element_id === mainElementId);
}

function standTypeTriggerTargets(rules: TriggerRule[], standTypeId: string): TriggerRule[] {
  return rules.filter((r) => r.source_stand_type_id === standTypeId);
}

function categoryTriggerTargets(rules: TriggerRule[], categoryId: string): TriggerRule[] {
  return rules.filter((r) => r.source_category_id === categoryId);
}

function equipmentUnitTriggerTargets(rules: TriggerRule[], equipmentUnitId: string): TriggerRule[] {
  return rules.filter((r) => r.source_equipment_unit_id === equipmentUnitId);
}

/**
 * Ekspanderer en konkret stand (hovedelement + evt. fysisk standtype) til den
 * fulle pakkelisten: obligatoriske elementer, rekursivt trigrede
 * elementer/utstyrsenheter (fra hovedelement, standtype, kategori og
 * enkeltelementer), og utstyrsenheter flatet ut til sine items (tagget med
 * hvilken enhet de kom fra, for gruppering i UI).
 */
export function expandEventStand(
  { mainElementId, standTypeId }: ExpandEventStandParams,
  graph: PackingGraph,
): ExpandEventStandResult {
  const itemsById = new Map(graph.items.map((i) => [i.id, i]));
  const resolvedItemIds = new Set<string>();
  const sourceUnitByItemId = new Map<string, string | null>();
  const unitQtyByItemId = new Map<string, number | null>();
  const visitedEquipmentUnitIds = new Set<string>();
  const itemQueue: string[] = [];
  const equipmentUnitQueue: string[] = [];

  function queueItem(
    itemId: string,
    sourceEquipmentUnitId: string | null = null,
    unitMinQty: number | null = null,
  ) {
    if (!resolvedItemIds.has(itemId)) {
      resolvedItemIds.add(itemId);
      sourceUnitByItemId.set(itemId, sourceEquipmentUnitId);
      unitQtyByItemId.set(itemId, unitMinQty);
      itemQueue.push(itemId);
    }
  }

  function queueEquipmentUnit(equipmentUnitId: string) {
    if (!visitedEquipmentUnitIds.has(equipmentUnitId)) {
      visitedEquipmentUnitIds.add(equipmentUnitId);
      equipmentUnitQueue.push(equipmentUnitId);
    }
  }

  function applyRules(rules: TriggerRule[]) {
    for (const rule of rules) {
      if (rule.target_item_id) queueItem(rule.target_item_id);
      if (rule.target_equipment_unit_id) queueEquipmentUnit(rule.target_equipment_unit_id);
    }
  }

  const mainElement = mainElementId
    ? graph.mainElements.find((s) => s.id === mainElementId)
    : undefined;

  if (mainElement) {
    // 1. Obligatoriske elementer satt direkte på hovedelementet.
    for (const mandatory of graph.mainElementMandatoryItems) {
      if (mandatory.main_element_id === mainElement.id) queueItem(mandatory.item_id);
    }

    // 2. Trigger-regler fra selve hovedelementet.
    applyRules(mainElementTriggerTargets(graph.triggerRules, mainElement.id));

    // 3. Trigger-regler fra hovedelementets kategori.
    if (mainElement.category_id) {
      applyRules(categoryTriggerTargets(graph.triggerRules, mainElement.category_id));
    }
  }

  // 4. Trigger-regler fra den fysiske standtypen (f.eks. Stand 3x3 -> Telt 3x3).
  if (standTypeId) {
    applyRules(standTypeTriggerTargets(graph.triggerRules, standTypeId));
  }

  // 5. Rekursivt: hvert item og hver utstyrsenhet kan selv trigge mer.
  while (itemQueue.length || equipmentUnitQueue.length) {
    while (itemQueue.length) {
      const itemId = itemQueue.shift()!;
      applyRules(itemTriggerTargets(graph.triggerRules, itemId));
    }
    while (equipmentUnitQueue.length) {
      const unitId = equipmentUnitQueue.shift()!;
      for (const link of graph.equipmentUnitItems) {
        if (link.equipment_unit_id === unitId) queueItem(link.item_id, unitId, link.min_qty);
      }
      // En utstyrsenhet kan selv trigge andre enheter/elementer (f.eks. satt
      // opp fra enhetens egen side: "denne følger alltid med enhet X").
      applyRules(equipmentUnitTriggerTargets(graph.triggerRules, unitId));
    }
  }

  const items: ExpandedPackingItem[] = [...resolvedItemIds]
    .map((id) => itemsById.get(id))
    .filter((item): item is Item => Boolean(item))
    .map((item) => {
      const unitQty = unitQtyByItemId.get(item.id) ?? null;
      return {
        item,
        // Antall fra utstyrsenheten (f.eks. 5 vegger med vindu i Telt 3x6) har
        // forrang — det er et kjent, fast antall for den spesifikke enheten.
        // Ellers brukes forbruksvarens eget standard minimumsantall.
        suggestedQty: unitQty ?? (item.kind === "consumable" ? item.default_min_qty : null),
        needsQtyConfirmation: item.kind === "consumable",
        sourceEquipmentUnitId: sourceUnitByItemId.get(item.id) ?? null,
      };
    });

  const category = mainElement?.category_id
    ? graph.categories.find((c) => c.id === mainElement.category_id)
    : undefined;

  return {
    items,
    requiresHygieneResponsible: category?.name.trim().toLowerCase() === "fødevare",
  };
}
