import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { RoadmapView } from "@/components/roadmap-view"
import { Footer } from "@/components/footer"
import { Link2 } from "lucide-react"

export default async function RoadmapPage({ params }: { params: { id: string } }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: collection, error } = await supabase
    .from("collections")
    .select(`
      *,
      collection_links (
        link:links (
          *,
          link_tags (
            tag:tags (*)
          )
        )
      )
    `)
    .eq("id", id)
    .eq("is_public", true)
    .single()

  if (error || !collection) {
    notFound()
  }

  // Transform data
  const transformedCollection = {
    ...collection,
    links: collection.collection_links?.map((cl: any) => ({
      ...cl.link,
      tags: cl.link.link_tags?.map((lt: any) => lt.tag) || [],
      link_tags: undefined
    })) || []
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card/50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Link2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                The ROOT Indexer
              </h1>
              <p className="text-sm text-muted-foreground">
                Public Roadmap
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-foreground mb-3">
              {transformedCollection.name}
            </h2>
            {transformedCollection.description && (
              <p className="text-lg text-muted-foreground text-pretty max-w-2xl mx-auto">
                {transformedCollection.description}
              </p>
            )}
          </div>

          <RoadmapView initialLinks={transformedCollection.links} />
        </div>
      </main>

      <Footer />
    </div>
  )
}
