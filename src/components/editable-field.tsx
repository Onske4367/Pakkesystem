"use client";

import { useTransition } from "react";

type FieldAction = (formData: FormData) => Promise<void>;

export function EditableField({
  action,
  id,
  field,
  defaultValue,
  placeholder,
  type = "text",
  extraFields,
  className,
  list,
}: {
  action: FieldAction;
  id: string;
  field: string;
  defaultValue: string;
  placeholder?: string;
  type?: string;
  extraFields?: Record<string, string>;
  className?: string;
  list?: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <input
      type={type}
      defaultValue={defaultValue}
      placeholder={placeholder}
      list={list}
      disabled={isPending}
      className={className ?? "border border-slate-300 rounded-md px-2 py-1 text-sm w-full disabled:opacity-50"}
      onBlur={(e) => {
        const value = e.currentTarget.value.trim();
        if (value === defaultValue) return;
        startTransition(async () => {
          const fd = new FormData();
          fd.set("id", id);
          fd.set("field", field);
          fd.set("value", value);
          for (const [k, v] of Object.entries(extraFields ?? {})) fd.set(k, v);
          await action(fd);
        });
      }}
    />
  );
}
