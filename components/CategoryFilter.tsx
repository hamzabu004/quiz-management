"use client";

import type { Category } from "../lib/types";

type CategoryFilterProps = {
  categories: Category[];
  selectedIds: number[];
  onChange: (next: number[]) => void;
};

export function CategoryFilter({
  categories,
  selectedIds,
  onChange,
}: CategoryFilterProps) {
  const toggleCategory = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((value) => value !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => onChange([])}
        className={`rounded-none border px-4 py-1.5 text-sm transition ${
          selectedIds.length === 0
            ? "border-white/50 bg-white/10 text-white"
            : "border-border text-muted hover:text-white"
        }`}
      >
        All
      </button>
      {categories.map((category) => {
        const active = selectedIds.includes(category.id);
        return (
          <button
            key={category.id}
            type="button"
            onClick={() => toggleCategory(category.id)}
            className={`rounded-none border px-4 py-1.5 text-sm transition ${
              active
                ? "border-white/50 bg-white/10 text-white"
                : "border-border text-muted hover:text-white"
            }`}
          >
            {category.name}
          </button>
        );
      })}
    </div>
  );
}

