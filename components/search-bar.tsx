"use client"

import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Tag } from "@/lib/types"

interface SearchBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedTags: string[]
  onTagRemove: (tagName: string) => void
  allTags: Tag[]
  onTagSelect: (tagName: string) => void
}

export function SearchBar({
  searchQuery,
  onSearchChange,
  selectedTags,
  onTagRemove,
  allTags,
  onTagSelect,
}: SearchBarProps) {
  const availableTags = allTags.filter((tag) => !selectedTags.includes(tag.name))

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search links by title, URL, or description..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 bg-card border-border"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={() => onSearchChange("")}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">Filtering by:</span>
          {selectedTags.map((tagName) => {
            const tag = allTags.find((t) => t.name === tagName)
            return (
              <Badge
                key={tagName}
                variant="default"
                className="cursor-pointer"
                style={{ backgroundColor: tag?.color }}
                onClick={() => onTagRemove(tagName)}
              >
                {tagName}
                <X className="w-3 h-3 ml-1" />
              </Badge>
            )
          })}
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-6"
            onClick={() => selectedTags.forEach(onTagRemove)}
          >
            Clear all
          </Button>
        </div>
      )}

      {availableTags.length > 0 && selectedTags.length === 0 && (
        <div className="flex flex-wrap gap-1.5">
          {availableTags.slice(0, 8).map((tag) => (
            <Badge
              key={tag.id}
              variant="outline"
              className="cursor-pointer hover:bg-secondary transition-colors text-xs"
              style={{ borderColor: tag.color, color: tag.color }}
              onClick={() => onTagSelect(tag.name)}
            >
              {tag.name}
            </Badge>
          ))}
          {availableTags.length > 8 && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              +{availableTags.length - 8} more
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
