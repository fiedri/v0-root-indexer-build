import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const searchParams = request.nextUrl.searchParams
  const search = searchParams.get("search") || ""
  const tags = searchParams.get("tags")?.split(",").filter(Boolean) || []

  let query = supabase
    .from("links")
    .select(`
      *,
      link_tags (
        tag:tags (*)
      )
    `)
    .order("created_at", { ascending: false })

  if (search) {
    query = query.or(`title.ilike.%${search}%,url.ilike.%${search}%,description.ilike.%${search}%`)
  }

  const { data: links, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Transform the data to flatten tags
  const transformedLinks = links?.map((link) => ({
    ...link,
    tags: link.link_tags?.map((lt: { tag: unknown }) => lt.tag) || [],
    link_tags: undefined,
  }))

  // Filter by tags if specified
  let filteredLinks = transformedLinks
  if (tags.length > 0) {
    filteredLinks = transformedLinks?.filter((link) =>
      tags.every((tagName) =>
        link.tags?.some((t: { name: string }) => t.name === tagName)
      )
    )
  }

  return NextResponse.json(filteredLinks || [])
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { url, title, description, tagIds, favicon_url } = body

  // Insert the link with user_id
  const { data: link, error: linkError } = await supabase
    .from("links")
    .insert({
      url,
      title,
      description: description || null,
      favicon_url: favicon_url || null,
      user_id: user.id,
    })
    .select()
    .single()

  if (linkError) {
    return NextResponse.json({ error: linkError.message }, { status: 500 })
  }

  // Insert tag associations
  if (tagIds && tagIds.length > 0) {
    const linkTags = tagIds.map((tagId: string) => ({
      link_id: link.id,
      tag_id: tagId,
    }))

    const { error: tagError } = await supabase.from("link_tags").insert(linkTags)

    if (tagError) {
      console.error("Error adding tags:", tagError)
    }
  }

  return NextResponse.json(link)
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 })
  }

  const { error } = await supabase.from("links").delete().eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
