import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase
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
    .order("created_at", { ascending: false })

  // If user is logged in, they see their own + public. If not, only public.
  if (user) {
    query = query.or(`user_id.eq.${user.id},is_public.eq.true`)
  } else {
    query = query.eq("is_public", true)
  }

  const { data: collections, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Transform data to flatten links and tags
  const transformed = collections?.map((col) => ({
    ...col,
    links: col.collection_links?.map((cl: any) => ({
      ...cl.link,
      tags: cl.link.link_tags?.map((lt: any) => lt.tag) || [],
      link_tags: undefined
    })) || [],
    collection_links: undefined
  }))

  return NextResponse.json(transformed || [])
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { name, description, is_public, link_ids } = await request.json()

  const { data: collection, error } = await supabase
    .from("collections")
    .insert({
      name,
      description,
      is_public: is_public || false,
      user_id: user.id
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (link_ids && link_ids.length > 0) {
    const colLinks = link_ids.map((linkId: string) => ({
      collection_id: collection.id,
      link_id: linkId
    }))
    const { error: linkError } = await supabase.from("collection_links").insert(colLinks)
    if (linkError) {
      console.error("Error adding links to collection:", linkError)
    }
  }

  return NextResponse.json(collection)
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id, name, description, is_public, link_ids } = await request.json()

  const { data: collection, error } = await supabase
    .from("collections")
    .update({ name, description, is_public, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (link_ids !== undefined) {
    // Sync links: delete old ones, insert new ones
    await supabase.from("collection_links").delete().eq("collection_id", id)
    
    if (link_ids.length > 0) {
      const colLinks = link_ids.map((linkId: string) => ({
        collection_id: id,
        link_id: linkId
      }))
      await supabase.from("collection_links").insert(colLinks)
    }
  }

  return NextResponse.json(collection)
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 })
  }

  const { error } = await supabase
    .from("collections")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
