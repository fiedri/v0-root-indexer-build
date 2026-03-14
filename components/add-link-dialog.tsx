"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Loader2, X, Link as LinkIcon, Check, Globe, Pencil, Layers } from "lucide-react"
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
import type { Tag, Collection } from "@/lib/types"

interface FetchedMetadata {
  title: string
  description: string
  favicon: string
  domain: string
  url: string
  image?: string | null
  suggestedTags?: string[]
  fetchFailed?: boolean
}

interface AddLinkDialogProps {
  tags: Tag[]
  collections: Collection[]
  onAddLink: (data: {
    url: string
    title: string
    description: string
    tagIds: string[]
    collectionIds: string[]
    favicon_url: string
  }) => Promise<void>
  onCreateTag: (name: string) => Promise<Tag | null>
  trigger?: React.ReactNode
}

export function AddLinkDialog({ tags, collections, onAddLink, onCreateTag, trigger }: AddLinkDialogProps) {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState("")
  const [metadata, setMetadata] = useState<FetchedMetadata | null>(null)
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([])
  const [newTagName, setNewTagName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [fetchError, setFetchError] = useState("")
  const [suggestedTags, setSuggestedTags] = useState<string[]>([])
  const [selectedSuggestedTags, setSelectedSuggestedTags] = useState<string[]>([])
  
  // Manual edit mode
  const [isEditMode, setIsEditMode] = useState(false)
  const [editedTitle, setEditedTitle] = useState("")
  const [editedDescription, setEditedDescription] = useState("")

  // Debounced URL fetch
  const fetchMetadata = useCallback(async (inputUrl: string) => {
    if (!inputUrl || inputUrl.length < 5) {
      setMetadata(null)
      return
    }

    setIsFetching(true)
    setFetchError("")
    
    try {
      const response = await fetch(`/api/metadata?url=${encodeURIComponent(inputUrl)}`)
      const data = await response.json()
      
      if (data.error) {
        setFetchError(data.error)
        setMetadata(null)
        setSuggestedTags([])
      } else {
        setMetadata(data)
        setEditedTitle(data.title || "")
        setEditedDescription(data.description || "")
        setFetchError("")
        
        if (data.fetchFailed) {
          setIsEditMode(true)
        }
        
        if (data.suggestedTags && data.suggestedTags.length > 0) {
          setSuggestedTags(data.suggestedTags)
          const matchingTags = tags.filter(t => 
            data.suggestedTags.includes(t.name.toLowerCase())
          )
          setSelectedTagIds(matchingTags.map(t => t.id))
        } else {
          setSuggestedTags([])
        }
      }
    } catch {
      setFetchError("Failed to fetch link details")
      setMetadata(null)
    } finally {
      setIsFetching(false)
    }
  }, [tags])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (url && (url.includes(".") || url.startsWith("http"))) {
        fetchMetadata(url)
      }
    }, 600)

    return () => clearTimeout(timer)
  }, [url, fetchMetadata])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!metadata) return

    setIsLoading(true)
    try {
      const finalTagIds = [...selectedTagIds]
      for (const tagName of selectedSuggestedTags) {
        const existingTag = tags.find(t => t.name.toLowerCase() === tagName.toLowerCase())
        if (!existingTag) {
          const newTag = await onCreateTag(tagName)
          if (newTag) {
            finalTagIds.push(newTag.id)
          }
        }
      }

      await onAddLink({
        url: metadata.url,
        title: isEditMode ? editedTitle : metadata.title,
        description: isEditMode ? editedDescription : metadata.description,
        tagIds: finalTagIds,
        collectionIds: selectedCollectionIds,
        favicon_url: metadata.favicon,
      })
      resetForm()
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setOpen(false)
    setUrl("")
    setMetadata(null)
    setSelectedTagIds([])
    setSelectedCollectionIds([])
    setSuggestedTags([])
    setSelectedSuggestedTags([])
    setIsEditMode(false)
    setEditedTitle("")
    setEditedDescription("")
    setFetchError("")
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

  const toggleCollection = (id: string) => {
    setSelectedCollectionIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      resetForm()
    }
  }

  const currentDescription = isEditMode ? editedDescription : metadata?.description || ""

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Link
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden flex flex-col p-0 shadow-2xl">
        <DialogHeader className="p-6 pb-2 shrink-0">
          <DialogTitle>Add New Link</DialogTitle>
          <DialogDescription>
            Save a URL to your brain and optionally assign it to collections.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <ScrollArea className="flex-1 px-6">
            <div className="space-y-5 py-2">
              <div className="space-y-2">
                <Label htmlFor="url" className="text-xs font-bold uppercase tracking-wider opacity-70">Paste URL</Label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="url"
                    type="text"
                    placeholder="https://example.com/article"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="pl-10 h-10 shadow-sm"
                    autoFocus
                  />
                  {isFetching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />
                  )}
                  {metadata && !isFetching && !metadata.fetchFailed && (
                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                  )}
                </div>
                {fetchError && (
                  <p className="text-sm text-destructive">{fetchError}</p>
                )}
              </div>

              {metadata && (
                <div className="rounded-xl border bg-muted/20 p-4 space-y-3 transition-all border-primary/10">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      {metadata.favicon ? (
                        <img
                          src={metadata.favicon}
                          alt=""
                          className="w-8 h-8 rounded flex-shrink-0 bg-background shadow-sm"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://www.google.com/s2/favicons?domain=${metadata.domain}&sz=64`
                          }}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded bg-muted flex items-center justify-center flex-shrink-0">
                          <Globe className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        {isEditMode ? (
                          <Input
                            value={editedTitle}
                            onChange={(e) => setEditedTitle(e.target.value)}
                            placeholder="Enter title..."
                            className="text-sm font-medium h-8"
                          />
                        ) : (
                          <h3 className="font-semibold text-sm leading-tight line-clamp-2">
                            {metadata.title}
                          </h3>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">
                          {metadata.domain}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsEditMode(!isEditMode)}
                      className="h-8 w-8 shrink-0 rounded-full hover:bg-background"
                    >
                      {isEditMode ? <Check className="w-4 h-4" /> : <Pencil className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                  
                  {isEditMode ? (
                    <Textarea
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                      placeholder="Enter description (optional)..."
                      className="text-sm min-h-[60px] resize-none"
                    />
                  ) : (
                    currentDescription && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {currentDescription}
                      </p>
                    )
                  )}
                </div>
              )}

              {/* Collections Selection */}
              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase tracking-wider opacity-70 flex items-center gap-2">
                  <Layers className="w-3 h-3" />
                  Add to Collections
                </Label>
                {collections.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 p-2.5 border rounded-lg bg-muted/10">
                    {collections.map((col) => (
                      <Badge
                        key={col.id}
                        variant={selectedCollectionIds.includes(col.id) ? "default" : "outline"}
                        className={cn(
                          "cursor-pointer transition-all h-6 text-[10px]",
                          selectedCollectionIds.includes(col.id) ? "shadow-sm" : "bg-background/50"
                        )}
                        onClick={() => toggleCollection(col.id)}
                      >
                        {col.name}
                        {selectedCollectionIds.includes(col.id) && <Check className="w-2.5 h-2.5 ml-1" />}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-muted-foreground italic px-1">No collections yet.</p>
                )}
              </div>

              {/* Tags Selection */}
              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase tracking-wider opacity-70">Tags</Label>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {tags.map((tag) => (
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
            <Button type="button" variant="ghost" size="sm" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              size="sm"
              className="min-w-[120px] shadow-sm"
              disabled={isLoading || !metadata || isFetching || (isEditMode && !editedTitle.trim())}
            >
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
              Save Link
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
