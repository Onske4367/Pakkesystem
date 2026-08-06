import { describe, expect, it } from "vitest";
import { expandEventStand, type PackingGraph } from "./expand";
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

function makeItem(overrides: Partial<Item> & Pick<Item, "id" | "name" | "kind">): Item {
  return {
    category_id: null,
    unit: null,
    default_min_qty: null,
    default_supplier: null,
    created_at: "",
    ...overrides,
  };
}

function makeGraph(overrides: Partial<PackingGraph>): PackingGraph {
  return {
    categories: [],
    items: [],
    equipmentUnits: [],
    equipmentUnitItems: [],
    mainElements: [],
    mainElementMandatoryItems: [],
    standTypes: [],
    triggerRules: [],
    ...overrides,
  };
}

function rule(overrides: Partial<TriggerRule> & Pick<TriggerRule, "id">): TriggerRule {
  return {
    source_main_element_id: null,
    source_stand_type_id: null,
    source_item_id: null,
    source_category_id: null,
    source_equipment_unit_id: null,
    target_item_id: null,
    target_equipment_unit_id: null,
    created_at: "",
    ...overrides,
  };
}

describe("expandEventStand", () => {
  it("expands Sukkerspinn into its parts, triggers Hygienekasse via Fødevare category, and flags qty confirmation for consumables", () => {
    const categories: Category[] = [{ id: "cat-fodevare", name: "Fødevare", created_at: "" }];

    const mainElements: MainElement[] = [
      { id: "me-sukkerspinn", name: "Sukkerspinn", category_id: "cat-fodevare", created_at: "" },
    ];

    const items: Item[] = [
      makeItem({ id: "i-motor", name: "Motor", kind: "equipment" }),
      makeItem({ id: "i-kolbe", name: "Kolbe", kind: "equipment" }),
      makeItem({ id: "i-globe", name: "Globe", kind: "equipment" }),
      makeItem({ id: "i-pinner", name: "Pinner", kind: "consumable", default_min_qty: 200 }),
      makeItem({ id: "i-poser", name: "Poser", kind: "consumable", default_min_qty: 200 }),
      makeItem({ id: "i-sukker", name: "Sukker", kind: "consumable", default_min_qty: 3 }),
      makeItem({ id: "i-hygiene-vateservietter", name: "Våtservietter", kind: "consumable", default_min_qty: 3 }),
    ];

    const equipmentUnits: EquipmentUnit[] = [
      { id: "eq-hygienekasse", name: "Hygienekasse", created_at: "" },
    ];

    const equipmentUnitItems: EquipmentUnitItem[] = [
      { id: "l1", equipment_unit_id: "eq-hygienekasse", item_id: "i-hygiene-vateservietter", min_qty: 3 },
    ];

    const triggerRules: TriggerRule[] = [
      ...["i-motor", "i-kolbe", "i-globe", "i-pinner", "i-poser", "i-sukker"].map((itemId, idx) =>
        rule({ id: `rule-${idx}`, source_main_element_id: "me-sukkerspinn", target_item_id: itemId }),
      ),
      rule({
        id: "rule-fodevare-hygiene",
        source_category_id: "cat-fodevare",
        target_equipment_unit_id: "eq-hygienekasse",
      }),
    ];

    const graph = makeGraph({
      categories,
      items,
      equipmentUnits,
      equipmentUnitItems,
      mainElements,
      triggerRules,
    });

    const result = expandEventStand({ mainElementId: "me-sukkerspinn" }, graph);

    const names = result.items.map((r) => r.item.name).sort();
    expect(names).toEqual(
      ["Globe", "Kolbe", "Motor", "Pinner", "Poser", "Sukker", "Våtservietter"].sort(),
    );

    expect(result.requiresHygieneResponsible).toBe(true);

    const pinner = result.items.find((r) => r.item.name === "Pinner")!;
    expect(pinner.needsQtyConfirmation).toBe(true);
    expect(pinner.suggestedQty).toBe(200);
    expect(pinner.sourceEquipmentUnitId).toBeNull();

    const motor = result.items.find((r) => r.item.name === "Motor")!;
    expect(motor.needsQtyConfirmation).toBe(false);
    expect(motor.suggestedQty).toBeNull();

    const vateservietter = result.items.find((r) => r.item.name === "Våtservietter")!;
    expect(vateservietter.sourceEquipmentUnitId).toBe("eq-hygienekasse");
  });

  it("does not require stand-responsible reminder for non-food categories", () => {
    const categories: Category[] = [{ id: "cat-telt", name: "Telt", created_at: "" }];
    const mainElements: MainElement[] = [
      { id: "me-telt", name: "Telt 3x3", category_id: "cat-telt", created_at: "" },
    ];
    const graph = makeGraph({ categories, mainElements });

    const result = expandEventStand({ mainElementId: "me-telt" }, graph);
    expect(result.requiresHygieneResponsible).toBe(false);
    expect(result.items).toEqual([]);
  });

  it("supports mandatory items set directly on the main element in addition to trigger rules", () => {
    const items: Item[] = [makeItem({ id: "i-bord", name: "Bord", kind: "equipment" })];
    const mainElements: MainElement[] = [{ id: "me-x", name: "Enkelt element", category_id: null, created_at: "" }];
    const mainElementMandatoryItems: MainElementMandatoryItem[] = [
      { id: "m1", main_element_id: "me-x", item_id: "i-bord" },
    ];
    const graph = makeGraph({ items, mainElements, mainElementMandatoryItems });

    const result = expandEventStand({ mainElementId: "me-x" }, graph);
    expect(result.items.map((r) => r.item.name)).toEqual(["Bord"]);
  });

  it("cascades item-to-item triggers and avoids infinite loops on cycles", () => {
    const items: Item[] = [
      makeItem({ id: "i-a", name: "A", kind: "equipment" }),
      makeItem({ id: "i-b", name: "B", kind: "equipment" }),
    ];
    const mainElements: MainElement[] = [{ id: "me-x", name: "X", category_id: null, created_at: "" }];
    const mainElementMandatoryItems: MainElementMandatoryItem[] = [
      { id: "m1", main_element_id: "me-x", item_id: "i-a" },
    ];
    const triggerRules: TriggerRule[] = [
      rule({ id: "r1", source_item_id: "i-a", target_item_id: "i-b" }),
      // Sykel: B trigger tilbake til A — skal ikke gi uendelig løkke.
      rule({ id: "r2", source_item_id: "i-b", target_item_id: "i-a" }),
    ];
    const graph = makeGraph({ items, mainElements, mainElementMandatoryItems, triggerRules });

    const result = expandEventStand({ mainElementId: "me-x" }, graph);
    expect(result.items.map((r) => r.item.name).sort()).toEqual(["A", "B"]);
  });

  it("expands physical stand-type triggers (e.g. Stand 3x3 -> Telt 3x3) independently of the main element", () => {
    const standTypes: StandType[] = [{ id: "st-3x3", name: "Stand 3x3", created_at: "" }];
    const items: Item[] = [
      makeItem({ id: "i-tak", name: "Tak 3x3", kind: "equipment" }),
      makeItem({ id: "i-vindu", name: "Vegger med vindu", kind: "equipment" }),
    ];
    const equipmentUnits: EquipmentUnit[] = [{ id: "eq-telt3x3", name: "Telt 3x3", created_at: "" }];
    const equipmentUnitItems: EquipmentUnitItem[] = [
      { id: "l1", equipment_unit_id: "eq-telt3x3", item_id: "i-tak", min_qty: 1 },
      { id: "l2", equipment_unit_id: "eq-telt3x3", item_id: "i-vindu", min_qty: 4 },
    ];
    const triggerRules: TriggerRule[] = [
      rule({ id: "r1", source_stand_type_id: "st-3x3", target_equipment_unit_id: "eq-telt3x3" }),
    ];
    const graph = makeGraph({ standTypes, items, equipmentUnits, equipmentUnitItems, triggerRules });

    const result = expandEventStand({ mainElementId: null, standTypeId: "st-3x3" }, graph);
    const names = result.items.map((r) => r.item.name).sort();
    expect(names).toEqual(["Tak 3x3", "Vegger med vindu"]);
    expect(result.items.every((r) => r.sourceEquipmentUnitId === "eq-telt3x3")).toBe(true);

    // Antall satt på utstyrsenheten (per-enhet min_qty) skal fylles inn som
    // forslag, selv for utstyr-elementer (ikke bare forbruksvarer).
    const vindu = result.items.find((r) => r.item.name === "Vegger med vindu")!;
    expect(vindu.suggestedQty).toBe(4);
    expect(vindu.needsQtyConfirmation).toBe(false);
    const tak = result.items.find((r) => r.item.name === "Tak 3x3")!;
    expect(tak.suggestedQty).toBe(1);
  });

  it("merges main-element items and stand-type items for the same event stand", () => {
    const mainElements: MainElement[] = [{ id: "me-sukkerspinn", name: "Sukkerspinn", category_id: null, created_at: "" }];
    const standTypes: StandType[] = [{ id: "st-3x6", name: "Stand 3x6", created_at: "" }];
    const items: Item[] = [
      makeItem({ id: "i-motor", name: "Motor", kind: "equipment" }),
      makeItem({ id: "i-tak", name: "Tak 3x6", kind: "equipment" }),
      makeItem({ id: "i-strom", name: "Kabeltrommel", kind: "equipment" }),
    ];
    const equipmentUnits: EquipmentUnit[] = [
      { id: "eq-telt3x6", name: "Telt 3x6", created_at: "" },
      { id: "eq-strom", name: "Strøm enhet", created_at: "" },
    ];
    const equipmentUnitItems: EquipmentUnitItem[] = [
      { id: "l1", equipment_unit_id: "eq-telt3x6", item_id: "i-tak", min_qty: 1 },
      { id: "l2", equipment_unit_id: "eq-strom", item_id: "i-strom", min_qty: 1 },
    ];
    const triggerRules: TriggerRule[] = [
      rule({ id: "r1", source_main_element_id: "me-sukkerspinn", target_item_id: "i-motor" }),
      rule({ id: "r2", source_stand_type_id: "st-3x6", target_equipment_unit_id: "eq-telt3x6" }),
      rule({ id: "r3", source_stand_type_id: "st-3x6", target_equipment_unit_id: "eq-strom" }),
    ];
    const graph = makeGraph({ mainElements, standTypes, items, equipmentUnits, equipmentUnitItems, triggerRules });

    const result = expandEventStand({ mainElementId: "me-sukkerspinn", standTypeId: "st-3x6" }, graph);
    const names = result.items.map((r) => r.item.name).sort();
    expect(names).toEqual(["Kabeltrommel", "Motor", "Tak 3x6"]);
  });

  it("lets an equipment unit trigger another equipment unit (set up from the unit's own page)", () => {
    const standTypes: StandType[] = [{ id: "st-3x6", name: "Stand 3x6", created_at: "" }];
    const items: Item[] = [
      makeItem({ id: "i-tak", name: "Tak 3x6", kind: "equipment" }),
      makeItem({ id: "i-kabel", name: "Kabeltrommel", kind: "equipment" }),
    ];
    const equipmentUnits: EquipmentUnit[] = [
      { id: "eq-telt", name: "Telt 3x6", created_at: "" },
      { id: "eq-strom", name: "Strøm enhet", created_at: "" },
    ];
    const equipmentUnitItems: EquipmentUnitItem[] = [
      { id: "l1", equipment_unit_id: "eq-telt", item_id: "i-tak", min_qty: 1 },
      { id: "l2", equipment_unit_id: "eq-strom", item_id: "i-kabel", min_qty: 1 },
    ];
    const triggerRules: TriggerRule[] = [
      rule({ id: "r1", source_stand_type_id: "st-3x6", target_equipment_unit_id: "eq-telt" }),
      // Satt opp fra Strøm enhet sin egen side: "trigges av Telt 3x6".
      rule({ id: "r2", source_equipment_unit_id: "eq-telt", target_equipment_unit_id: "eq-strom" }),
    ];
    const graph = makeGraph({ standTypes, items, equipmentUnits, equipmentUnitItems, triggerRules });

    const result = expandEventStand({ standTypeId: "st-3x6" }, graph);
    const names = result.items.map((r) => r.item.name).sort();
    expect(names).toEqual(["Kabeltrommel", "Tak 3x6"]);
    const kabel = result.items.find((r) => r.item.name === "Kabeltrommel")!;
    expect(kabel.sourceEquipmentUnitId).toBe("eq-strom");
  });
});
