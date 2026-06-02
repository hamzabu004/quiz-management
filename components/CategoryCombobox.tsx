"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import type { Category } from "../lib/types";
import { createCategory, getCategories } from "../lib/actions/categories";

type CategoryComboboxProps = {
  value: number | null;
  onChange: (value: number) => void;
  allowCreate?: boolean;
};

export function CategoryCombobox({
  value,
  onChange,
  allowCreate = false,
}: CategoryComboboxProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getCategories()
      .then((data) => {
        if (mounted) {
          setCategories(data);
        }
      })
      .catch((error) => {
        toast.error(error.message ?? "Failed to load categories.");
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) {
      return;
    }

    try {
      const created = await createCategory(name);
      setCategories((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      onChange(created.id);
      setNewName("");
      toast.success("Category created.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create category.";
      toast.error(message);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <label className="text-base font-medium">Category</label>
      <select
        value={value ?? ""}
        onChange={(event) => {
          const nextValue = Number(event.target.value);
          if (!Number.isNaN(nextValue)) {
            onChange(nextValue);
          }
        }}
        className="rounded-none border border-border bg-surface px-3 py-2 text-base"
        disabled={loading}
      >
        <option value="" disabled>
          {loading ? "Loading categories..." : "Select a category"}
        </option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>

      {allowCreate ? (
        <div className="flex items-center gap-2">
          <input
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="New category name"
            className="flex-1 rounded-none border border-border bg-surface px-3 py-2 text-base"
          />
          <button
            type="button"
            onClick={handleCreate}
            className="rounded-none border border-border px-3 py-2 text-base hover:bg-white/10"
          >
            Create
          </button>
        </div>
      ) : null}
    </div>
  );
}
