"use client";

import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CascadingCategorySelect } from "@/components/search/CascadingCategorySelect";
import { cn } from "@/lib/utils";

interface FilterValues {
  category: string;
  location: string;
  dateFrom: string;
  dateTo: string;
  sort: string;
}

interface FilterPanelProps {
  filters: FilterValues;
  onChange: (filters: FilterValues) => void;
}

export function FilterPanel({ filters, onChange }: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hasActiveFilters =
    filters.category ||
    filters.location ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.sort !== "newest";

  const handleChange = (key: keyof FilterValues, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  const handleClear = () => {
    onChange({
      category: "",
      location: "",
      dateFrom: "",
      dateTo: "",
      sort: "newest",
    });
  };

  const filterControls = (
    <>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Category</Label>
        <CascadingCategorySelect
          value={filters.category}
          onChange={(val) => handleChange("category", val)}
          placeholder="All categories"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Location</Label>
        <Input
          value={filters.location}
          onChange={(e) => handleChange("location", e.target.value)}
          placeholder="e.g. AC1, Library"
          className="h-9 text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Date From</Label>
        <Input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => handleChange("dateFrom", e.target.value)}
          className="h-9 text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Date To</Label>
        <Input
          type="date"
          value={filters.dateTo}
          onChange={(e) => handleChange("dateTo", e.target.value)}
          className="h-9 text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Sort</Label>
        <Select
          value={filters.sort}
          onValueChange={(val) => handleChange("sort", val)}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
            <SelectItem value="az">A–Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {hasActiveFilters && (
        <div className="flex items-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="text-muted-foreground h-9"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Clear
          </Button>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Desktop: inline horizontal row */}
      <div className="hidden md:grid md:grid-cols-6 md:gap-3 md:items-end">
        {filterControls}
      </div>

      {/* Mobile: collapsible panel */}
      <div className="md:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen((prev) => !prev)}
          className="w-full justify-between"
        >
          <span className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </span>
          {hasActiveFilters && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
              !
            </span>
          )}
        </Button>
        <div
          className={cn(
            "grid gap-3 overflow-hidden transition-all",
            isOpen ? "grid-rows-[1fr] mt-3" : "grid-rows-[0fr]"
          )}
        >
          <div className="overflow-hidden space-y-3">{filterControls}</div>
        </div>
      </div>
    </>
  );
}
