"use client";

import { useState, useEffect } from "react";
import { ChevronRight, ChevronLeft, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Category } from "@/types";

interface CategoryPickerProps {
  value: string[];
  onChange: (path: string[]) => void;
}

function findCategoriesByPath(
  categories: Category[],
  path: string[]
): Category[] {
  if (path.length === 0) return categories;
  const parent = categories.find((c) => c.id === path[0]);
  if (!parent) return [];
  if (path.length === 1) return parent.children;
  return findCategoriesByPath(parent.children, path.slice(1));
}

function getLabelForId(categories: Category[], id: string): string {
  for (const cat of categories) {
    if (cat.id === id) return cat.label;
    const found = getLabelForId(cat.children, id);
    if (found) return found;
  }
  return id;
}

function hasChildren(categories: Category[], id: string): boolean {
  for (const cat of categories) {
    if (cat.id === id) return cat.children.length > 0;
    const found = hasChildren(cat.children, id);
    if (found !== false) return found;
  }
  return false;
}

export function CategoryPicker({ value, onChange }: CategoryPickerProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // navigating path — may be longer than selected value while browsing
  const [navPath, setNavPath] = useState<string[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const json = await res.json();
          setCategories(json.data ?? json.categories ?? []);
        }
      } catch {
        /* silent */
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  // Keep navPath in sync if value is set externally
  useEffect(() => {
    setNavPath(value);
  }, [value]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-5 w-48" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-11 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const currentOptions = findCategoriesByPath(categories, navPath);
  const isAtRoot = navPath.length === 0;
  const isLeafLevel = currentOptions.length === 0;

  const handleSelect = (id: string) => {
    const newNavPath = [...navPath, id];
    const children = findCategoriesByPath(categories, newNavPath);
    if (children.length === 0) {
      // Leaf selected — confirm
      onChange(newNavPath);
      setNavPath(newNavPath);
    } else {
      // Has children — drill down but also select this level
      onChange(newNavPath);
      setNavPath(newNavPath);
    }
  };

  const handleBack = () => {
    const newPath = navPath.slice(0, -1);
    setNavPath(newPath);
    onChange(newPath);
  };

  const handleClear = () => {
    setNavPath([]);
    onChange([]);
  };

  return (
    <div className="space-y-3">
      {/* Breadcrumb trail */}
      {navPath.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap text-sm">
          <button
            type="button"
            onClick={handleClear}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            All
          </button>
          {navPath.map((id, index) => (
            <span key={id} className="flex items-center gap-1">
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              <button
                type="button"
                onClick={() => {
                  const newPath = navPath.slice(0, index + 1);
                  setNavPath(newPath);
                  onChange(newPath);
                }}
                className={cn(
                  "font-medium transition-colors hover:text-primary",
                  index === navPath.length - 1
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                {getLabelForId(categories, id)}
              </button>
            </span>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-5 w-5 p-0 ml-1 text-muted-foreground hover:text-destructive"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Navigation panel */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Header row */}
        {!isAtRoot && (
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/40">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Back
            </Button>
            <span className="text-xs text-muted-foreground">
              {getLabelForId(categories, navPath[navPath.length - 1])}
            </span>
          </div>
        )}

        {isLeafLevel ? (
          <div className="px-4 py-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Check className="h-4 w-4 text-primary" />
            <span>
              <span className="text-foreground font-medium">
                {getLabelForId(categories, navPath[navPath.length - 1])}
              </span>{" "}
              selected — no further subcategories
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-3">
            {currentOptions.map((cat) => {
              const isSelected = value[navPath.length] === cat.id && navPath.join(",").startsWith(value.slice(0, navPath.length).join(","));
              const isNavSelected = navPath[navPath.length] === cat.id;
              const selected = value.includes(cat.id) && value[value.indexOf(cat.id) - 1] === navPath[navPath.length - 1];

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSelect(cat.id)}
                  className={cn(
                    "flex items-center justify-between px-4 py-3 text-sm bg-card hover:bg-accent/10 transition-colors text-left",
                    (selected || isNavSelected) && "bg-primary/8 text-primary font-medium"
                  )}
                >
                  <span className="flex-1 leading-tight">{cat.label}</span>
                  {cat.children.length > 0 ? (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 ml-2" />
                  ) : value[value.length - 1] === cat.id ? (
                    <Check className="h-3.5 w-3.5 text-primary flex-shrink-0 ml-2" />
                  ) : null}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {value.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Select a category above. Click through levels to narrow down.
        </p>
      )}
    </div>
  );
}
