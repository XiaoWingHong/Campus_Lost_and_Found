"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronRight, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Category } from "@/types";

interface CascadingCategorySelectProps {
  value: string;
  onChange: (categoryId: string) => void;
  placeholder?: string;
}

function getLabelPath(categories: Category[], id: string): string[] {
  function search(cats: Category[], path: string[]): string[] | null {
    for (const cat of cats) {
      if (cat.id === id) return [...path, cat.label];
      const found = search(cat.children, [...path, cat.label]);
      if (found) return found;
    }
    return null;
  }
  return search(categories, []) ?? [];
}

function getIdPath(categories: Category[], id: string): string[] {
  function search(cats: Category[], path: string[]): string[] | null {
    for (const category of cats) {
      const nextPath = [...path, category.id];
      if (category.id === id) return nextPath;
      const found = search(category.children, nextPath);
      if (found) return found;
    }
    return null;
  }
  return search(categories, []) ?? [];
}

export function CascadingCategorySelect({
  value,
  onChange,
  placeholder = "All categories",
}: CascadingCategorySelectProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredPath, setHoveredPath] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((json) => {
        setCategories(json.data ?? json.categories ?? []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selectedLabelPath = value ? getLabelPath(categories, value) : [];
  const displayLabel =
    selectedLabelPath.length > 0
      ? selectedLabelPath[selectedLabelPath.length - 1]
      : placeholder;

  // Build columns based on hovered path
  function getColumns(): { items: Category[]; selectedId: string | null }[] {
    const cols: { items: Category[]; selectedId: string | null }[] = [];
    cols.push({ items: categories, selectedId: hoveredPath[0] ?? null });

    let current = categories;
    for (let i = 0; i < hoveredPath.length; i++) {
      const next = current.find((c) => c.id === hoveredPath[i]);
      if (!next || next.children.length === 0) break;
      current = next.children;
      cols.push({ items: current, selectedId: hoveredPath[i + 1] ?? null });
    }
    return cols;
  }

  const columns = getColumns();

  const handleHover = (id: string, depth: number) => {
    setHoveredPath((prev) => [...prev.slice(0, depth), id]);
  };

  const handleItemClick = (category: Category, depth: number) => {
    if (category.children.length === 0) {
      handleSelect(category.id);
      return;
    }

    const isExpandedAtDepth = hoveredPath[depth] === category.id;
    if (isExpandedAtDepth) {
      handleSelect(category.id);
      return;
    }

    setHoveredPath((prev) => [...prev.slice(0, depth), category.id]);
  };

  const handleSelect = (id: string) => {
    onChange(id);
    setIsOpen(false);
    setHoveredPath([]);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() =>
          setIsOpen((previousOpen) => {
            const nextOpen = !previousOpen;
            if (nextOpen) {
              setHoveredPath(value ? getIdPath(categories, value) : []);
            }
            return nextOpen;
          })
        }
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors hover:bg-accent/10 focus:outline-none focus:ring-1 focus:ring-ring",
          isOpen && "ring-1 ring-ring"
        )}
      >
        <span
          className={cn(
            "truncate flex-1 text-left",
            !value && "text-muted-foreground"
          )}
        >
          {displayLabel}
        </span>
        <span className="flex items-center gap-0.5 ml-1 flex-shrink-0">
          {value && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => e.key === "Enter" && handleClear(e as unknown as React.MouseEvent)}
              className="p-0.5 rounded-sm hover:bg-muted text-muted-foreground"
            >
              <X className="h-3 w-3" />
            </span>
          )}
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-muted-foreground transition-transform",
              isOpen && "rotate-180"
            )}
          />
        </span>
      </button>

      {isOpen && categories.length > 0 && (
        <div className="absolute left-0 top-full z-50 mt-1 flex rounded-xl border border-border bg-popover shadow-lg min-w-[180px] max-w-[540px]">
          {columns.map((col, colIdx) => (
            <div
              key={colIdx}
              className={cn(
                "min-w-[160px] py-1",
                colIdx > 0 && "border-l border-border"
              )}
            >
              {col.items.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onMouseEnter={() => handleHover(cat.id, colIdx)}
                  onClick={() => handleItemClick(cat, colIdx)}
                  className={cn(
                    "flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-accent/10 transition-colors text-left",
                    col.selectedId === cat.id && "bg-accent/15 text-primary font-medium",
                    value === cat.id && "bg-primary/10 text-primary"
                  )}
                >
                  <span>{cat.label}</span>
                  {cat.children.length > 0 && (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground ml-2 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
