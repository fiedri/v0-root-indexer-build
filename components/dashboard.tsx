"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import useSWR, { mutate } from "swr"
import { Link2, FolderOpen, Share2, Check, ExternalLink, Menu, Plus } from "lucide-react"
import { LinkCard } from "./link-card"
import { AddLinkDialog } from "./add-link-dialog"
import { AddCollectionDialog } from "./add-collection-dialog"
import { SearchBar } from "./search-bar"
import { Sidebar } from "./sidebar"
import { UserMenu } from "./user-menu"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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
    toast.success("Collection created")
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
      prev.includes(tagName) ? prev.filter((t) => t !== tagName) : [...prev, tagName]
    )
  }, [])

  const handleCollectionSelect = (id: string | null) => {
    setSelectedCollectionId(id)
    setIsMobileMenuOpen(false) // Cierra el menú en móvil tras seleccionar
  }

  const copyShareLink = (id: string) => {
    const url = `${window.location.origin}/share/roadmap/${id}`
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    toast.success("Link copied")
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

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar Desktop */}
      <Sidebar {...sidebarProps} className="hidden lg:block w-64 border-r" />

      <main className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
              {/* Menu Trigger Mobile */}
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden shrink-0">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-72">
                  <SheetTitle className="sr-only">Menu de Navegación</SheetTitle>
                  <Sidebar {...sidebarProps} className="w-full h-full border-none" />
                </SheetContent>
              </Sheet>

              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Link2 className="w-4 h-4 text-primary" />
                </div>
                <div className="truncate">
                  <h1 className="text-sm sm:text-lg font-semibold text-foreground truncate leading-tight">
                    {selectedCollection ? selectedCollection.name : "ROOT Indexer"}
                  </h1>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              <div className="hidden sm:flex items-center gap-2">
                <AddCollectionDialog links={allLinks} tags={tags} onAddCollection={handleAddCollection} />
                <AddLinkDialog tags={tags} onAddLink={handleAddLink} onCreateTag={handleCreateTag} />
              </div>
              
              {/* Botón flotante o compacto en móvil para añadir */}
              <div className="sm:hidden">
                <AddLinkDialog 
                  tags={tags} 
                  onAddLink={handleAddLink} 
                  onCreateTag={handleCreateTag}
                  trigger={<Button size="icon" className="rounded-full w-8 h-8"><Plus className="w-4 h-4" /></Button>}
                />
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
                <p className="text-xs text-muted-foreground mt-1">Try changing filters or search terms</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {filteredLinks.length} {filteredLinks.length === 1 ? "Result" : "Results"}
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
