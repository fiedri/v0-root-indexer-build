"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import useSWR, { mutate } from "swr"
import { Link2, FolderOpen, Share2, Copy, Check, ExternalLink } from "lucide-react"
import { LinkCard } from "./link-card"
import { AddLinkDialog } from "./add-link-dialog"
import { AddCollectionDialog } from "./add-collection-dialog"
import { SearchBar } from "./search-bar"
import { Sidebar } from "./sidebar"
import { UserMenu } from "./user-menu"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import type { Link, Tag, Collection } from "@/lib/types"

interface DashboardProps {
  userEmail: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function Dashboard({ userEmail }: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null)
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Build query params
  const queryParams = new URLSearchParams()
  if (debouncedSearch) queryParams.set("search", debouncedSearch)
  if (selectedTags.length > 0) queryParams.set("tags", selectedTags.join(","))

  const linksUrl = `/api/links?${queryParams.toString()}`
  const { data: allLinks = [], isLoading: linksLoading } = useSWR<Link[]>(linksUrl, fetcher)
  const { data: tags = [] } = useSWR<Tag[]>("/api/tags", fetcher)
  const { data: collections = [] } = useSWR<Collection[]>("/api/collections", fetcher)

  const selectedCollection = useMemo(() => 
    collections.find(c => c.id === selectedCollectionId),
    [collections, selectedCollectionId]
  )

  const filteredLinks = useMemo(() => {
    if (!selectedCollectionId || !selectedCollection) return allLinks
    
    return selectedCollection.links?.filter(link => {
      const matchesSearch = !debouncedSearch || 
        link.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        link.url.toLowerCase().includes(debouncedSearch.toLowerCase())
      
      const matchesTags = selectedTags.length === 0 ||
        selectedTags.every(tagName => link.tags?.some(t => t.name === tagName))
        
      return matchesSearch && matchesTags
    }) || []
  }, [allLinks, selectedCollectionId, selectedCollection, debouncedSearch, selectedTags])

  const handleAddLink = async (data: any) => {
    await fetch("/api/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    mutate(linksUrl)
    mutate("/api/collections")
  }

  const handleAddCollection = async (data: any) => {
    await fetch("/api/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    mutate("/api/collections")
    toast.success("Collection created successfully")
  }

  const handleDeleteLink = async (id: string) => {
    await fetch(`/api/links?id=${id}`, { method: "DELETE" })
    mutate(linksUrl)
    mutate("/api/collections")
  }

  const handleDeleteTag = async (id: string) => {
    await fetch(`/api/tags?id=${id}`, { method: "DELETE" })
    mutate("/api/tags")
    mutate(linksUrl)
  }

  const handleCreateTag = async (name: string): Promise<Tag | null> => {
    const response = await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
    if (response.ok) {
      const tag = await response.json()
      mutate("/api/tags")
      return tag
    }
    return null
  }

  const handleTagSelect = useCallback((tagName: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagName)
        ? prev.filter((t) => t !== tagName)
        : [...prev, tagName]
    )
  }, [])

  const handleTagRemove = useCallback((tagName: string) => {
    setSelectedTags((prev) => prev.filter((t) => t !== tagName))
  }, [])

  const copyShareLink = (id: string) => {
    const url = `${window.location.origin}/share/roadmap/${id}`
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    toast.success("Share link copied to clipboard")
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Count recent links (last 7 days)
  const recentCount = allLinks.filter((link) => {
    const createdAt = new Date(link.created_at)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return createdAt > weekAgo
  }).length

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar
        tags={tags}
        selectedTags={selectedTags}
        onTagSelect={handleTagSelect}
        onTagDelete={handleDeleteTag}
        totalLinks={allLinks.length}
        recentCount={recentCount}
        collections={collections}
        selectedCollectionId={selectedCollectionId}
        onCollectionSelect={setSelectedCollectionId}
      />

      <main className="flex-1 flex flex-col">
        <header className="border-b border-border bg-card/50 px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Link2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">
                  {selectedCollection ? selectedCollection.name : "The ROOT Indexer"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {selectedCollection ? (selectedCollection.description || "Collection View") : "Your second brain for code"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {selectedCollection?.is_public && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={() => copyShareLink(selectedCollection.id)}
                >
                  {copiedId === selectedCollection.id ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                  <span>Share</span>
                </Button>
              )}
              <AddCollectionDialog
                links={allLinks}
                tags={tags}
                onAddCollection={handleAddCollection}
              />
              <AddLinkDialog
                tags={tags}
                onAddLink={handleAddLink}
                onCreateTag={handleCreateTag}
              />
              <UserMenu email={userEmail} />
            </div>
          </div>
        </header>

        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <SearchBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedTags={selectedTags}
              onTagRemove={handleTagRemove}
              allTags={tags}
              onTagSelect={handleTagSelect}
            />

            {linksLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-24 rounded-lg bg-card animate-pulse"
                  />
                ))}
              </div>
            ) : filteredLinks.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                  <FolderOpen className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-1">
                  {debouncedSearch || selectedTags.length > 0 || selectedCollectionId
                    ? "No links found"
                    : "No links saved yet"}
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  {debouncedSearch || selectedTags.length > 0 || selectedCollectionId
                    ? "Try adjusting your search or filters"
                    : "Start building your second brain by adding your first link"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {filteredLinks.length} {filteredLinks.length === 1 ? "link" : "links"} found
                    {selectedCollectionId && " in this collection"}
                  </p>
                  {selectedCollectionId && selectedCollection?.is_public && (
                    <a 
                      href={`/share/roadmap/${selectedCollectionId}`}
                      target="_blank"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      View Public Page <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                {filteredLinks.map((link) => (
                  <LinkCard
                    key={link.id}
                    link={link}
                    onDelete={handleDeleteLink}
                    onTagClick={handleTagSelect}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
