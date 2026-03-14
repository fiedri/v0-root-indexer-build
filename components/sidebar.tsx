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
  className?: string
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
  className,
}: SidebarProps) {
  return (
    <aside className={cn("flex flex-col bg-card/50 p-4 h-full overflow-y-auto", className)}>
      <div className="space-y-6">
        <div>
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 px-2">
            Overview
          </h3>
          <nav className="space-y-0.5">
            <button
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
                selectedTags.length === 0 && !selectedCollectionId
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
              onClick={() => {
                selectedTags.forEach((t) => onTagSelect(t))
                onCollectionSelect(null)
              }}
            >
              <Folder className="w-4 h-4 shrink-0" />
              <span className="font-medium">All Links</span>
              <Badge variant={selectedTags.length === 0 && !selectedCollectionId ? "outline" : "secondary"} className="ml-auto text-[10px] h-4">
                {totalLinks}
              </Badge>
            </button>
            <button
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
            >
              <Clock className="w-4 h-4 shrink-0" />
              <span className="font-medium">Recent</span>
              <Badge variant="secondary" className="ml-auto text-[10px] h-4">
                {recentCount}
              </Badge>
            </button>
          </nav>
        </div>

        <div>
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 px-2 flex items-center gap-2">
            <Layers className="w-3 h-3" />
            Collections
          </h3>
          <nav className="space-y-0.5">
            {collections.length === 0 ? (
              <p className="text-xs text-muted-foreground/60 px-3 py-2 italic">
                No collections.
              </p>
            ) : (
              collections.map((col) => (
                <button
                  key={col.id}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all group",
                    selectedCollectionId === col.id
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                  onClick={() => onCollectionSelect(col.id)}
                >
                  <div className="w-4 h-4 flex items-center justify-center shrink-0">
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-[2px] rotate-45 border border-current",
                      selectedCollectionId === col.id ? "bg-primary" : ""
                    )} />
                  </div>
                  <span className="truncate flex-1 text-left font-medium">{col.name}</span>
                  {col.is_public && (
                    <Share2 className="w-3 h-3 opacity-40 group-hover:opacity-100" />
                  )}
                </button>
              ))
            )}
          </nav>
        </div>

        <div>
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 px-2 flex items-center gap-2">
            <Hash className="w-3 h-3" />
            Tags
          </h3>
          <nav className="space-y-0.5">
            {tags.length === 0 ? (
              <p className="text-xs text-muted-foreground/60 px-3 py-2 italic">
                No tags.
              </p>
            ) : (
              tags.map((tag) => (
                <div
                  key={tag.id}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all group cursor-pointer",
                    selectedTags.includes(tag.name)
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                  onClick={() => onTagSelect(tag.name)}
                >
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="truncate flex-1 text-left font-medium">{tag.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onTagDelete(tag.id)
                    }}
                    className="opacity-0 lg:group-hover:opacity-100 p-1 hover:text-destructive transition-all"
                    type="button"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </nav>
        </div>

        <div className="pt-6 mt-auto">
          <div className="p-3 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 text-xs text-foreground font-semibold mb-1">
              <Link2 className="w-3 h-3 text-primary" />
              <span>ROOT Indexer</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Organize your brain. One link at a time.
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
