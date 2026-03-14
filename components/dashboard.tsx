"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import useSWR, { mutate } from "swr"
import { Link2, FolderOpen, Share2, Check, ExternalLink, Menu, Plus, Globe, Lock, FolderPlus } from "lucide-react"
import { LinkCard } from "./link-card"
import { AddLinkDialog } from "./add-link-dialog"
import { AddCollectionDialog } from "./add-collection-dialog"
import { EditCollectionDialog } from "./edit-collection-dialog"
import { SearchBar } from "./search-bar"
import { Sidebar } from "./sidebar"
import { UserMenu } from "./user-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { useIsMobile } from "@/hooks/use-mobile"
import type { Link, Tag, Collection } from "@/lib/types"

interface DashboardProps {
  userEmail: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function Dashboard({ userEmail }: DashboardProps) {
  const isMobile = useIsMobile()
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null)
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Prevenir errores de hidratación esperando al montaje
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

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
    const res = await fetch("/api/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      toast.success("Link saved successfully")
      mutate(linksUrl)
      mutate("/api/collections")
    }
  }

  const handleAddCollection = async (data: any) => {
    const res = await fetch("/api/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      toast.success("Collection created")
      mutate("/api/collections")
    }
  }

  const handleEditCollection = async (id: string, data: any) => {
    const res = await fetch("/api/collections", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...data }),
    })
    if (res.ok) {
      toast.success("Collection updated")
      mutate("/api/collections")
    }
  }

  const handleDeleteCollection = async (id: string) => {
    const res = await fetch(`/api/collections?id=${id}`, {
      method: "DELETE",
    })
    if (res.ok) {
      toast.success("Collection deleted")
      setSelectedCollectionId(null)
      mutate("/api/collections")
    }
  }

  const handleDeleteLink = async (id: string) => {
    const res = await fetch(`/api/links?id=${id}`, { method: "DELETE" })
    if (res.ok) {
      mutate(linksUrl)
      mutate("/api/collections")
    }
  }

  const handleDeleteTag = async (id: string) => {
    const res = await fetch(`/api/tags?id=${id}`, { method: "DELETE" })
    if (res.ok) {
      mutate("/api/tags")
      mutate(linksUrl)
    }
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
      prev.includes(tagName) ? prev.filter((t) => t !== tagName) : [...prev, tagName]
    )
  }, [])

  const handleCollectionSelect = (id: string | null) => {
    setSelectedCollectionId(id)
    setIsMobileMenuOpen(false)
  }

  const copyShareLink = (id: string) => {
    const url = `${window.location.origin}/share/roadmap/${id}`
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    toast.success("Link copied to clipboard")
    setTimeout(() => setCopiedId(null), 2000)
  }

  const recentCount = allLinks.filter((link) => {
    const createdAt = new Date(link.created_at)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return createdAt > weekAgo
  }).length

  const sidebarProps = {
    tags,
    selectedTags,
    onTagSelect: handleTagSelect,
    onTagDelete: handleDeleteTag,
    totalLinks: allLinks.length,
    recentCount,
    collections,
    selectedCollectionId,
    onCollectionSelect: handleCollectionSelect,
  }

  if (!mounted) {
    return <div className="min-h-screen bg-background" />
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar {...sidebarProps} className="hidden lg:flex w-64 border-r" />

      <main className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-3 sm:px-6 shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden shrink-0">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-72">
                  <SheetTitle className="sr-only">Navegación</SheetTitle>
                  <Sidebar {...sidebarProps} className="w-full h-full border-none" />
                </SheetContent>
              </Sheet>

              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Link2 className="w-4 h-4 text-primary" />
                </div>
                <div className="truncate flex flex-col">
                  {selectedCollection && (
                    <div className="flex items-center gap-1 mb-0.5">
                      {selectedCollection.is_public ? (
                        <Badge variant="outline" className="text-[9px] h-4 px-1 py-0 text-primary border-primary/30 bg-primary/5 uppercase font-bold flex items-center gap-0.5">
                          <Globe className="w-2.5 h-2.5" /> Public
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[9px] h-4 px-1 py-0 text-muted-foreground border-muted-foreground/30 uppercase font-bold flex items-center gap-0.5">
                          <Lock className="w-2.5 h-2.5" /> Private
                        </Badge>
                      )}
                    </div>
                  )}
                  <h1 className="text-sm sm:text-lg font-semibold text-foreground truncate leading-tight flex items-center gap-2">
                    {selectedCollection ? selectedCollection.name : "The ROOT Indexer"}
                    {selectedCollection && (
                      <EditCollectionDialog 
                        collection={selectedCollection}
                        links={allLinks}
                        tags={tags}
                        onEditCollection={handleEditCollection}
                        onDeleteCollection={handleDeleteCollection}
                      />
                    )}
                  </h1>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                {selectedCollection && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className={cn(
                      "gap-2 h-9 px-2 sm:px-3 transition-all",
                      selectedCollection.is_public ? "border-primary/30 text-primary hover:bg-primary/5" : ""
                    )}
                    onClick={() => copyShareLink(selectedCollection.id)}
                  >
                    {copiedId === selectedCollection.id ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                    <span className="hidden sm:inline">Share</span>
                  </Button>
                )}
                
                {!isMobile && (
                  <div className="hidden sm:block">
                    <AddCollectionDialog
                      links={allLinks}
                      tags={tags}
                      onAddCollection={handleAddCollection}
                    />
                  </div>
                )}

                {isMobile ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" className="h-9 px-2 shadow-sm">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-background border-border shadow-xl p-1">
                      <AddLinkDialog
                        tags={tags}
                        collections={collections}
                        onAddLink={handleAddLink}
                        onCreateTag={handleCreateTag}
                        trigger={
                          <DropdownMenuItem 
                            onSelect={(e) => e.preventDefault()} 
                            className="gap-2 cursor-pointer focus:bg-accent focus:text-accent-foreground py-2.5 px-3 rounded-md transition-colors"
                          >
                            <Plus className="w-4 h-4 text-primary" />
                            <span className="font-medium text-sm">Add Link</span>
                          </DropdownMenuItem>
                        }
                      />
                      <AddCollectionDialog
                        links={allLinks}
                        tags={tags}
                        onAddCollection={handleAddCollection}
                        trigger={
                          <DropdownMenuItem 
                            onSelect={(e) => e.preventDefault()} 
                            className="gap-2 cursor-pointer focus:bg-accent focus:text-accent-foreground py-2.5 px-3 rounded-md transition-colors"
                          >
                            <FolderPlus className="w-4 h-4 text-primary" />
                            <span className="font-medium text-sm">New Collection</span>
                          </DropdownMenuItem>
                        }
                      />
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <AddLinkDialog
                    tags={tags}
                    collections={collections}
                    onAddLink={handleAddLink}
                    onCreateTag={handleCreateTag}
                    trigger={
                      <Button size="sm" className="h-9 px-2 sm:px-4 shadow-sm">
                        <Plus className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">Add Link</span>
                      </Button>
                    }
                  />
                )}
              </div>

              <UserMenu email={userEmail} />
            </div>
          </div>
        </header>

        <div className="flex-1 p-4 sm:p-6 overflow-x-hidden">
          <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
            <SearchBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedTags={selectedTags}
              onTagRemove={(t) => setSelectedTags(prev => prev.filter(tag => tag !== t))}
              allTags={tags}
              onTagSelect={handleTagSelect}
            />

            {linksLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-24 rounded-lg bg-card animate-pulse border" />
                ))}
              </div>
            ) : filteredLinks.length === 0 ? (
              <div className="text-center py-12 sm:py-20 bg-card/30 rounded-xl border border-dashed">
                <FolderOpen className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-20" />
                <h3 className="text-sm font-medium text-foreground">No links found</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedCollectionId ? "This collection is empty." : "Your library is empty."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {filteredLinks.length} {filteredLinks.length === 1 ? "Link" : "Links"}
                  </p>
                  {selectedCollectionId && selectedCollection?.is_public && (
                    <Button variant="link" size="sm" asChild className="h-auto p-0 text-[10px] sm:text-xs text-primary">
                      <a href={`/share/roadmap/${selectedCollectionId}`} target="_blank">
                        Public Page <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </Button>
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
