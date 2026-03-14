"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Loader2, X, Link as LinkIcon, Check, Globe, Pencil } from "lucide-react"
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
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import type { Tag } from "@/lib/types"

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
  onAddLink: (data: {
    url: string
    title: string
    description: string
    tagIds: string[]
    favicon_url: string
  }) => Promise<void>
  onCreateTag: (name: string) => Promise<Tag | null>
}

export function AddLinkDialog({ tags, onAddLink, onCreateTag }: AddLinkDialogProps) {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState("")
  const [metadata, setMetadata] = useState<FetchedMetadata | null>(null)
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
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
        
        // If fetch failed, auto-enable edit mode
        if (data.fetchFailed) {
          setIsEditMode(true)
        }
        
        // Set suggested tags from metadata
        if (data.suggestedTags && data.suggestedTags.length > 0) {
          setSuggestedTags(data.suggestedTags)
          // Auto-select suggested tags that already exist
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

  // Auto-fetch when URL changes (debounced)
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
      // Create any new tags from selected suggested tags
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
        favicon_url: metadata.favicon,
      })
      // Reset form
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

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      resetForm()
    }
  }

  const currentTitle = isEditMode ? editedTitle : metadata?.title || ""
  const currentDescription = isEditMode ? editedDescription : metadata?.description || ""

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Link
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Link</DialogTitle>
          <DialogDescription>
            Paste a URL below to automatically fetch its metadata and save it to your collection.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* URL Input */}
          <div className="space-y-2">
            <Label htmlFor="url">Paste URL</Label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="url"
                type="text"
                placeholder="https://example.com/article"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="pl-10"
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

          {/* Metadata Preview / Edit Mode */}
          {metadata && (
            <div className="rounded-lg border bg-secondary/50 p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  {metadata.favicon ? (
                    <img
                      src={metadata.favicon}
                      alt=""
                      className="w-8 h-8 rounded flex-shrink-0 bg-background"
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
                        className="text-sm font-medium mb-1"
                      />
                    ) : (
                      <h3 className="font-medium text-sm leading-tight line-clamp-2">
                        {metadata.title}
                      </h3>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {metadata.domain}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditMode(!isEditMode)}
                  className="flex-shrink-0"
                  title={isEditMode ? "Done editing" : "Edit metadata"}
                >
                  {isEditMode ? <Check className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                </Button>
              </div>
              
              {isEditMode ? (
                <Textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  placeholder="Enter description (optional)..."
                  className="text-sm min-h-[60px]"
                />
              ) : (
                currentDescription && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {currentDescription}
                  </p>
                )
              )}
              
              {metadata.fetchFailed && (
                <p className="text-xs text-amber-500">
                  Could not fetch metadata automatically. Please edit the title above.
                </p>
              )}
            </div>
          )}

          {/* Suggested Tags from Article */}
          {suggestedTags.length > 0 && (
            <div className="space-y-2">
              <Label className="text-muted-foreground">Suggested Tags (from article)</Label>
              <div className="flex flex-wrap gap-2">
                {suggestedTags.map((tagName) => {
                  const existingTag = tags.find(t => t.name.toLowerCase() === tagName.toLowerCase())
                  const isSelected = existingTag 
                    ? selectedTagIds.includes(existingTag.id)
                    : selectedSuggestedTags.includes(tagName)
                  
                  return (
                    <Badge
                      key={tagName}
                      variant={isSelected ? "default" : "outline"}
                      className="cursor-pointer transition-all hover:opacity-80"
                      onClick={() => {
                        if (existingTag) {
                          toggleTag(existingTag.id)
                        } else {
                          setSelectedSuggestedTags(prev => 
                            prev.includes(tagName) 
                              ? prev.filter(t => t !== tagName)
                              : [...prev, tagName]
                          )
                        }
                      }}
                    >
                      {tagName}
                      {isSelected && <Check className="w-3 h-3 ml-1" />}
                    </Badge>
                  )
                })}
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="space-y-2">
            <Label>Your Tags (optional)</Label>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant={selectedTagIds.includes(tag.id) ? "default" : "secondary"}
                    className="cursor-pointer transition-all hover:opacity-80"
                    style={{
                      borderLeft: `3px solid ${tag.color}`,
                      backgroundColor: selectedTagIds.includes(tag.id) ? tag.color : undefined,
                      color: selectedTagIds.includes(tag.id) ? "#fff" : undefined,
                    }}
                    onClick={() => toggleTag(tag.id)}
                  >
                    {tag.name}
                    {selectedTagIds.includes(tag.id) && (
                      <X className="w-3 h-3 ml-1" />
                    )}
                  </Badge>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                placeholder="Create new tag..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
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
                onClick={handleCreateTag}
                disabled={!newTagName.trim()}
              >
                Add
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !metadata || isFetching || (isEditMode && !editedTitle.trim())}
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Link
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
