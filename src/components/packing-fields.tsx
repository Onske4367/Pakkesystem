"use client";

import { useTransition } from "react";

type UpdateAction = (formData: FormData) => Promise<void>;

function buildFormData(base: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(base)) fd.set(k, v);
  return fd;
}

export function ToggleCheckbox({
  action,
  id,
  eventStandId,
  field,
  defaultChecked,
}: {
  action: UpdateAction;
  id: string;
  eventStandId: string;
  field: string;
  defaultChecked: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <input
      type="checkbox"
      defaultChecked={defaultChecked}
      disabled={isPending}
      className="w-5 h-5 accent-green-700 cursor-pointer disabled:opacity-50"
      onChange={(e) => {
        const checked = e.currentTarget.checked;
        startTransition(async () => {
          await action(
            buildFormData({ id, event_stand_id: eventStandId, field, value: String(checked) }),
          );
        });
      }}
    />
  );
}

export function GroupToggleCheckbox({
  action,
  eventStandId,
  sourceEquipmentUnitId,
  field,
  title,
}: {
  action: UpdateAction;
  eventStandId: string;
  sourceEquipmentUnitId: string | null;
  field: string;
  title?: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <input
      type="checkbox"
      title={title}
      disabled={isPending}
      className="w-4 h-4 accent-white cursor-pointer disabled:opacity-50"
      onChange={(e) => {
        const checked = e.currentTarget.checked;
        startTransition(async () => {
          await action(
            buildFormData({
              event_stand_id: eventStandId,
              source_equipment_unit_id: sourceEquipmentUnitId ?? "",
              field,
              value: String(checked),
            }),
          );
        });
      }}
    />
  );
}

export function InlineTextField({
  action,
  id,
  eventStandId,
  field,
  defaultValue,
  placeholder,
  className,
}: {
  action: UpdateAction;
  id: string;
  eventStandId: string;
  field: string;
  defaultValue: string;
  placeholder?: string;
  className?: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <input
      type="text"
      defaultValue={defaultValue}
      placeholder={placeholder}
      disabled={isPending}
      className={className ?? "border border-slate-300 rounded-md px-2 py-1 text-sm w-full disabled:opacity-50"}
      onBlur={(e) => {
        const value = e.currentTarget.value;
        startTransition(async () => {
          await action(buildFormData({ id, event_stand_id: eventStandId, field, value }));
        });
      }}
    />
  );
}
