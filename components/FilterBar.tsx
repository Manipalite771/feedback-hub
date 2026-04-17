"use client";

import type { CommentType } from "@/lib/validators";
import { SlidersHorizontal } from "lucide-react";

interface FilterBarProps {
  sort: "newest" | "upvotes";
  onSortChange: (sort: "newest" | "upvotes") => void;
  typeFilters: string[];
  onTypeFiltersChange: (types: string[]) => void;
}

const TYPES: CommentType[] = ["Question", "Suggestion", "Request"];

const TYPE_STYLES: Record<CommentType, { active: string; inactive: string }> = {
  Question: {
    active: "bg-blue-100 text-blue-700 border-blue-300",
    inactive: "bg-white text-gray-500 border-gray-200 hover:border-blue-300 hover:text-blue-600",
  },
  Suggestion: {
    active: "bg-green-100 text-green-700 border-green-300",
    inactive: "bg-white text-gray-500 border-gray-200 hover:border-green-300 hover:text-green-600",
  },
  Request: {
    active: "bg-amber-100 text-amber-700 border-amber-300",
    inactive: "bg-white text-gray-500 border-gray-200 hover:border-amber-300 hover:text-amber-600",
  },
};

export default function FilterBar({
  sort,
  onSortChange,
  typeFilters,
  onTypeFiltersChange,
}: FilterBarProps) {
  const toggleType = (type: string) => {
    if (typeFilters.includes(type)) {
      onTypeFiltersChange(typeFilters.filter((t) => t !== type));
    } else {
      onTypeFiltersChange([...typeFilters, type]);
    }
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-1.5">
        <SlidersHorizontal className="w-4 h-4 text-gray-400" />
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as "newest" | "upvotes")}
          className="text-sm border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="newest">Newest first</option>
          <option value="upvotes">Most upvoted</option>
        </select>
      </div>

      <div className="flex items-center gap-1.5">
        {TYPES.map((type) => {
          const isActive = typeFilters.includes(type);
          const styles = TYPE_STYLES[type];
          return (
            <button
              key={type}
              onClick={() => toggleType(type)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                isActive ? styles.active : styles.inactive
              }`}
            >
              {type}
            </button>
          );
        })}
      </div>
    </div>
  );
}
