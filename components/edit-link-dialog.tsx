"use client"

import { useState, useEffect } from "react"
import { Loader2, Check, Globe, Pencil, Hash, Link as LinkIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { Link, Tag } from "@/lib/types"

interface EditLinkDialogProps {
  link: Link & { tags?: Tag[] }
  allTags: Tag[]
  onUpdate: (data: {
    id: string
    title: string
    description: string
    tagIds: string[]
  }) => Promise<void>
  onCreateTag: (name: string) => Promise<Tag | null>
  trigger?: React.ReactNode
}

export function EditLinkDialog({ link, allTags, onUpdate, onCreateTag, trigger }: EditLinkDialogProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(link.title)
  const [description, setDescription] = useState(link.description || "")
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    link.tags?.map((t) => t.id) || []
  )
  const [newTagName, setNewTagName] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Update local state when link prop changes
  useEffect(() => {
    setTitle(link.title)
    setDescription(link.description || "")
    setSelectedTagIds(link.tags?.map((t) => t.id) || [])
  }, [link])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsLoading(true)
    try {
      await onUpdate({
        id: link.id,
        title,
        description,
        tagIds: selectedTagIds,
      })
      setOpen(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return
    const tag = await onCreateTag(newTagName.trim())
    if (tag) {
      setSelectedTagIds((prev) => [...prev, tag.id])
      setNewTagName("")
    }
  }

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    )
  }

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace("www.", "")
    } catch {
      return url
    }
  }

  const domain = getDomain(link.url)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon">
            <Pencil className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden flex flex-col p-0 shadow-2xl">
        <DialogHeader className="p-6 pb-2 shrink-0">
          <DialogTitle>Edit Resource</DialogTitle>
          <DialogDescription>
            Update the title, description, and tags for this resource.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <ScrollArea className="flex-1 px-6">
            <div className="space-y-5 py-2">
              <div className="rounded-xl border bg-muted/20 p-4 space-y-4 transition-all border-primary/10">
                <div className="flex items-center gap-3">
                  {link.favicon_url ? (
                    <img
                      src={link.favicon_url}
                      alt=""
                      className="w-8 h-8 rounded flex-shrink-0 bg-background shadow-sm"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded bg-muted flex items-center justify-center flex-shrink-0">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold truncate">
                      {domain}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title" className="text-[10px] font-bold uppercase tracking-wider opacity-70">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Resource title..."
                    className="text-sm font-medium h-9"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-[10px] font-bold uppercase tracking-wider opacity-70">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter description (optional)..."
                    className="text-sm min-h-[80px] resize-none"
                  />
                </div>
              </div>

              {/* Tags Selection */}
              <div className="space-y-3">
                <Label className="text-[10px] font-bold uppercase tracking-wider opacity-70 flex items-center gap-2">
                  <Hash className="w-3 h-3" />
                  Manage Tags
                </Label>
                {allTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {allTags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant={selectedTagIds.includes(tag.id) ? "default" : "secondary"}
                        className="cursor-pointer transition-all text-[10px] h-6"
                        style={{
                          borderLeft: `3px solid ${tag.color}`,
                          backgroundColor: selectedTagIds.includes(tag.id) ? tag.color : undefined,
                          color: selectedTagIds.includes(tag.id) ? "#fff" : undefined,
                        }}
                        onClick={() => toggleTag(tag.id)}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    placeholder="Create new tag..."
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    className="h-9 text-xs"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleCreateTag()
                      }
                    }}
                  />
                  <Button 
                    type="button" 
                    variant="secondary" 
                    size="sm"
                    onClick={handleCreateTag}
                    disabled={!newTagName.trim()}
                    className="h-9"
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="p-6 pt-4 border-t shrink-0 bg-background flex flex-row gap-2 justify-end">
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              size="sm"
              className="min-w-[120px] shadow-sm"
              disabled={isLoading || !title.trim()}
            >
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
              Update Link
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
