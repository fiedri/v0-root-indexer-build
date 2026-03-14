"use client"

import { useState, useMemo } from "react"
import { SearchBar } from "./search-bar"
import { LinkCard } from "./link-card"
import { FolderOpen } from "lucide-react"
import type { Link, Tag } from "@/lib/types"

interface RoadmapViewProps {
  initialLinks: Link[]
}

export function RoadmapView({ initialLinks }: RoadmapViewProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  // Extract all unique tags from initialLinks
  const allTags = useMemo(() => {
    const tagMap = new Map<string, Tag>()
    initialLinks.forEach((link) => {
      link.tags?.forEach((tag) => {
        if (!tagMap.has(tag.name)) {
          tagMap.set(tag.name, tag)
        }
      })
    })
    return Array.from(tagMap.values())
  }, [initialLinks])

  const filteredLinks = useMemo(() => {
    return initialLinks.filter((link) => {
      const matchesSearch =
        link.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        link.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (link.description?.toLowerCase() || "").includes(searchQuery.toLowerCase())

      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.every((tagName) =>
          link.tags?.some((t) => t.name === tagName)
        )

      return matchesSearch && matchesTags
    })
  }, [initialLinks, searchQuery, selectedTags])

  const handleTagSelect = (tagName: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagName) ? prev.filter((t) => t !== tagName) : [...prev, tagName]
    )
  }

  const handleTagRemove = (tagName: string) => {
    setSelectedTags((prev) => prev.filter((t) => t !== tagName))
  }

  return (
    <div className="space-y-6">
      <SearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedTags={selectedTags}
        onTagRemove={handleTagRemove}
        allTags={allTags}
        onTagSelect={handleTagSelect}
      />

      {filteredLinks.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
            <FolderOpen className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">
            No links found
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Try adjusting your search or filters
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {filteredLinks.length} {filteredLinks.length === 1 ? "link" : "links"} found
          </p>
          {filteredLinks.map((link) => (
            <LinkCard
              key={link.id}
              link={link}
              onTagClick={handleTagSelect}
              showActions={false}
            />
          ))}
        </div>
      )}
    </div>
  )
}
