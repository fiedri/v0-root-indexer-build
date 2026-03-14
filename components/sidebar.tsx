"use client"

import { Hash, Link2, Clock, Folder, Layers, Share2, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Tag, Collection } from "@/lib/types"

interface SidebarProps {
  tags: Tag[]
  selectedTags: string[]
  onTagSelect: (tagName: string) => void
  onTagDelete: (id: string) => void
  totalLinks: number
  recentCount: number
  collections: Collection[]
  selectedCollectionId: string | null
  onCollectionSelect: (id: string | null) => void
}

export function Sidebar({
  tags,
  selectedTags,
  onTagSelect,
  onTagDelete,
  totalLinks,
  recentCount,
  collections,
  selectedCollectionId,
  onCollectionSelect,
}: SidebarProps) {
  return (
    <aside className="w-64 flex-shrink-0 border-r border-border bg-card/50 p-4 hidden lg:block overflow-y-auto">
      <div className="space-y-6">
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Overview
          </h3>
          <nav className="space-y-1">
            <button
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                selectedTags.length === 0 && !selectedCollectionId
                  ? "bg-primary/10 text-primary"
                  : "text-foreground hover:bg-secondary"
              )}
              onClick={() => {
                selectedTags.forEach((t) => onTagSelect(t))
                onCollectionSelect(null)
              }}
            >
              <Folder className="w-4 h-4" />
              <span>All Links</span>
              <Badge variant="secondary" className="ml-auto text-xs">
                {totalLinks}
              </Badge>
            </button>
            <button
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-foreground hover:bg-secondary transition-colors"
            >
              <Clock className="w-4 h-4" />
              <span>Recent</span>
              <Badge variant="secondary" className="ml-auto text-xs">
                {recentCount}
              </Badge>
            </button>
          </nav>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Layers className="w-3 h-3" />
            Collections
          </h3>
          <nav className="space-y-1">
            {collections.length === 0 ? (
              <p className="text-sm text-muted-foreground px-3 py-2">
                No collections yet.
              </p>
            ) : (
              collections.map((col) => (
                <button
                  key={col.id}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors group",
                    selectedCollectionId === col.id
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-secondary"
                  )}
                  onClick={() => onCollectionSelect(col.id)}
                >
                  <div className="w-4 h-4 flex items-center justify-center">
                    <div className={cn(
                      "w-2 h-2 rounded-sm rotate-45 border border-current",
                      selectedCollectionId === col.id ? "bg-primary" : ""
                    )} />
                  </div>
                  <span className="truncate flex-1 text-left">{col.name}</span>
                  {col.is_public && (
                    <Share2 className="w-3 h-3 text-muted-foreground opacity-60" />
                  )}
                </button>
              ))
            )}
          </nav>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Hash className="w-3 h-3" />
            Tags
          </h3>
          <nav className="space-y-1">
            {tags.length === 0 ? (
              <p className="text-sm text-muted-foreground px-3 py-2">
                No tags yet. Add tags when saving links.
              </p>
            ) : (
              tags.map((tag) => (
                <div
                  key={tag.id}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors group cursor-pointer",
                    selectedTags.includes(tag.name)
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-secondary"
                  )}
                  onClick={() => onTagSelect(tag.name)}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="truncate flex-1 text-left">{tag.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onTagDelete(tag.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-all"
                    type="button"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </nav>
        </div>

        <div className="pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link2 className="w-3 h-3" />
            <span>The ROOT Indexer</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Your second brain for code
          </p>
        </div>
      </div>
    </aside>
  )
}
