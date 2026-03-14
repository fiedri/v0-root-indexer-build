"use client"

import { useState, useMemo, useEffect } from "react"
import { Pencil, Check, Search, Trash2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Link as LinkType, Tag, Collection } from "@/lib/types"

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  is_public: z.boolean().default(false),
  link_ids: z.array(z.string()).default([]),
})

interface EditCollectionDialogProps {
  collection: Collection
  links: LinkType[]
  tags: Tag[]
  onEditCollection: (id: string, data: z.infer<typeof formSchema>) => Promise<void>
  onDeleteCollection: (id: string) => Promise<void>
}

export function EditCollectionDialog({ 
  collection, 
  links, 
  tags, 
  onEditCollection,
  onDeleteCollection 
}: EditCollectionDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [linkSearch, setLinkSearch] = useState("")
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: collection.name,
      description: collection.description || "",
      is_public: collection.is_public,
      link_ids: collection.links?.map(l => l.id) || [],
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        name: collection.name,
        description: collection.description || "",
        is_public: collection.is_public,
        link_ids: collection.links?.map(l => l.id) || [],
      })
    }
  }, [collection, open, form])

  const filteredLinks = useMemo(() => {
    return links.filter(link => {
      const matchesSearch = !linkSearch || 
        link.title.toLowerCase().includes(linkSearch.toLowerCase()) ||
        link.url.toLowerCase().includes(linkSearch.toLowerCase())
      
      const matchesTag = !selectedTagId || 
        link.tags?.some(t => t.id === selectedTagId)
        
      return matchesSearch && matchesTag
    })
  }, [links, linkSearch, selectedTagId])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      await onEditCollection(collection.id, values)
      setOpen(false)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this collection? Links inside will not be deleted.")) return
    
    setIsDeleting(true)
    try {
      await onDeleteCollection(collection.id)
      setOpen(false)
    } finally {
      setIsDeleting(false)
    }
  }

  const toggleLink = (id: string) => {
    const current = form.getValues("link_ids")
    if (current.includes(id)) {
      form.setValue("link_ids", current.filter((i) => i !== id), { shouldValidate: true })
    } else {
      form.setValue("link_ids", [...current, id], { shouldValidate: true })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
          <Pencil className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-[95vw] sm:max-w-[500px] max-h-[85vh] flex flex-col p-0 overflow-hidden box-border shadow-2xl">
        <DialogHeader className="p-5 pb-3 border-b bg-background shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-bold">Edit Collection</DialogTitle>
              <DialogDescription className="text-xs">
                Update collection details or manage links.
              </DialogDescription>
            </div>
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              className="text-destructive hover:bg-destructive/10"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden min-h-0">
            <div className="flex-1 overflow-y-auto p-5 pr-3 space-y-5 box-border min-h-0">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-semibold uppercase tracking-wider opacity-70">Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Rust Roadmap" className="w-full text-sm py-1.5 h-9" {...field} />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-semibold uppercase tracking-wider opacity-70">Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="What is this collection about?" 
                        className="w-full resize-none text-sm min-h-[70px] py-2"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_public"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3 bg-muted/20 box-border">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm">Public Roadmap</FormLabel>
                      <FormDescription className="text-[10px]">Visible to anyone with the link.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between border-b pb-1">
                  <FormLabel className="text-xs font-bold uppercase tracking-wider opacity-70">Links Selection</FormLabel>
                  <Badge variant="outline" className="text-[9px] font-mono h-4 px-1.5">
                    {form.watch("link_ids").length} SELECTED
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input 
                      placeholder="Filter title or URL..." 
                      className="w-full pl-8 h-8 text-xs bg-muted/10 border-muted"
                      value={linkSearch}
                      onChange={(e) => setLinkSearch(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5 p-2 border rounded-md bg-muted/10 box-border">
                    <Badge 
                      variant={selectedTagId === null ? "default" : "ghost"}
                      className="text-[9px] cursor-pointer h-5 px-2 py-0"
                      onClick={() => setSelectedTagId(null)}
                    >
                      All
                    </Badge>
                    {tags.map(tag => (
                      <Badge
                        key={tag.id}
                        variant={selectedTagId === tag.id ? "default" : "outline"}
                        className="text-[9px] cursor-pointer h-5 px-2 py-0 border-current transition-all"
                        style={selectedTagId === tag.id ? { backgroundColor: tag.color } : { color: tag.color }}
                        onClick={() => setSelectedTagId(tag.id)}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="rounded-md border bg-card/40 overflow-hidden box-border">
                  <div className="max-h-[220px] overflow-y-auto p-1 space-y-1">
                    {filteredLinks.length === 0 ? (
                      <div className="py-8 text-center text-muted-foreground">
                        <p className="text-[10px]">No links match your filter</p>
                      </div>
                    ) : (
                      filteredLinks.map((link) => (
                        <div
                          key={link.id}
                          className={cn(
                            "flex items-center justify-between p-2 rounded border text-left cursor-pointer transition-all box-border",
                            form.watch("link_ids").includes(link.id)
                              ? "bg-primary/5 border-primary/30"
                              : "hover:bg-accent border-transparent"
                          )}
                          onClick={() => toggleLink(link.id)}
                        >
                          <div className="flex flex-col gap-0.5 min-w-0 pr-3">
                            <span className="text-[11px] font-semibold truncate leading-tight">{link.title}</span>
                            <span className="text-[9px] text-muted-foreground truncate opacity-60">{link.url}</span>
                          </div>
                          <div className={cn(
                            "w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center border transition-all",
                            form.watch("link_ids").includes(link.id)
                              ? "bg-primary border-primary shadow-sm"
                              : "border-muted-foreground/30 bg-background"
                          )}>
                            {form.watch("link_ids").includes(link.id) && (
                              <Check className="w-2.5 h-2.5 text-primary-foreground stroke-[3px]" />
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="p-4 border-t shrink-0 bg-background flex flex-row items-center gap-2 justify-end box-border">
              <Button 
                type="button" 
                variant="ghost" 
                size="sm"
                onClick={() => setOpen(false)}
                disabled={isLoading || isDeleting}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isLoading || isDeleting} className="min-w-[120px] shadow-sm">
                {isLoading ? "Saving..." : "Update Collection"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
