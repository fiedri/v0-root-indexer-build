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
    <aside className={cn(
      "flex flex-col bg-card/50 p-4 lg:h-screen lg:sticky lg:top-0 border-r border-border/50 overflow-hidden", 
      className
    )}>
      <div className="space-y-6 flex flex-col h-full overflow-hidden">
        <div className="shrink-0">
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 px-2">
            Overview
          </h3>
          <nav className="space-y-0.5">
            <button
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
                selectedTags.length === 0 && !selectedCollectionId
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
              onClick={() => {
                selectedTags.forEach((t) => onTagSelect(t))
                onCollectionSelect(null)
              }}
            >
              <Folder className="w-4 h-4 shrink-0" />
              <span className="font-semibold">All Links</span>
              <Badge variant={selectedTags.length === 0 && !selectedCollectionId ? "outline" : "secondary"} className="ml-auto text-[10px] h-4 border-current/30">
                {totalLinks}
              </Badge>
            </button>
            <button
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
            >
              <Clock className="w-4 h-4 shrink-0" />
              <span className="font-semibold">Recent</span>
              <Badge variant="secondary" className="ml-auto text-[10px] h-4">
                {recentCount}
              </Badge>
            </button>
          </nav>
        </div>

        <div className="shrink-0">
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 px-2 flex items-center gap-2">
            <Layers className="w-3 h-3" />
            Collections
          </h3>
          <nav className="space-y-0.5">
            {collections.length === 0 ? (
              <p className="text-xs text-muted-foreground/60 px-3 py-2 italic">
                No collections yet.
              </p>
            ) : (
              collections.map((col) => (
                <button
                  key={col.id}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group",
                    selectedCollectionId === col.id
                      ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground border border-transparent"
                  )}
                  onClick={() => onCollectionSelect(col.id)}
                >
                  <div className="w-4 h-4 flex items-center justify-center shrink-0">
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-[2px] rotate-45 border border-current transition-all",
                      selectedCollectionId === col.id ? "bg-primary scale-110" : ""
                    )} />
                  </div>
                  <span className="truncate flex-1 text-left font-semibold">{col.name}</span>
                  {col.is_public && (
                    <Share2 className="w-3 h-3 opacity-100 lg:opacity-40 lg:group-hover:opacity-100" />
                  )}
                </button>
              ))
            )}
          </nav>
        </div>

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 px-2 flex items-center gap-2 shrink-0">
            <Hash className="w-3 h-3" />
            Tags
          </h3>
          <nav className="flex-1 overflow-y-auto pr-2 space-y-0.5 scrollbar-thin-gray">
            {tags.length === 0 ? (
              <p className="text-xs text-muted-foreground/60 px-3 py-2 italic">
                No tags yet.
              </p>
            ) : (
              tags.map((tag) => (
                <div
                  key={tag.id}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group cursor-pointer",
                    selectedTags.includes(tag.name)
                      ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground border border-transparent"
                  )}
                  onClick={() => onTagSelect(tag.name)}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-inner"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="truncate flex-1 text-left font-semibold">{tag.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onTagDelete(tag.id)
                    }}
                    className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    type="button"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </nav>
        </div>

        <div className="pt-6 shrink-0 mt-auto">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-card to-secondary/30 border border-border/50 shadow-sm">
            <div className="flex items-center gap-2 text-xs text-foreground font-bold mb-1.5">
              <Link2 className="w-3.5 h-3.5 text-primary" />
              <span>ROOT Indexer</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Organize your brain. <br />
              One link at a time.
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
