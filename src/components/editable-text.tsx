"use client";

import { useTransition } from "react";

type RenameAction = (formData: FormData) => Promise<void>;

export function EditableText({
  action,
  id,
  defaultValue,
  className,
}: {
  action: RenameAction;
  id: string;
  defaultValue: string;
  className?: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <input
      type="text"
      defaultValue={defaultValue}
      disabled={isPending}
      className={className ?? "border border-slate-300 rounded-md px-2 py-1 text-sm disabled:opacity-50"}
      onBlur={(e) => {
        const value = e.currentTarget.value.trim();
        if (!value || value === defaultValue) return;
        startTransition(async () => {
          const fd = new FormData();
          fd.set("id", id);
          fd.set("value", value);
          await action(fd);
        });
      }}
    />
  );
}
