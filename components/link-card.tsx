"use client"

import { ExternalLink, Trash2, Globe } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { Link, Tag } from "@/lib/types"

interface LinkCardProps {
  link: Link & { tags?: Tag[] }
  onDelete?: (id: string) => void
  onTagClick: (tagName: string) => void
  showActions?: boolean
}

export function LinkCard({ link, onDelete, onTagClick, showActions = true }: LinkCardProps) {
  const hostname = new URL(link.url).hostname.replace("www.", "")

  return (
    <Card className="group hover:border-primary/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="flex-shrink-0 w-8 h-8 rounded bg-secondary flex items-center justify-center">
              {link.favicon_url ? (
                <img
                  src={link.favicon_url}
                  alt=""
                  className="w-5 h-5 rounded"
                  onError={(e) => {
                    e.currentTarget.style.display = "none"
                    e.currentTarget.nextElementSibling?.classList.remove("hidden")
                  }}
                />
              ) : null}
              <Globe className={`w-4 h-4 text-muted-foreground ${link.favicon_url ? "hidden" : ""}`} />
            </div>
            <div className="min-w-0 flex-1">
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground hover:text-primary transition-colors line-clamp-1 flex items-center gap-1.5"
              >
                <span className="truncate">{link.title}</span>
                <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity" />
              </a>
              <p className="text-sm text-muted-foreground truncate mt-0.5">
                {hostname}
              </p>
              {link.description && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {link.description}
                </p>
              )}
              {link.tags && link.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {link.tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="secondary"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-xs"
                      style={{ borderLeft: `3px solid ${tag.color}` }}
                      onClick={() => onTagClick(tag.name)}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          {showActions && onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 hover:bg-red-50"
              onClick={() => onDelete(link.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
