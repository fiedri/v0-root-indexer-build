import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function DELETE() {
  try {
    const supabase = await createClient()
    
    // Get the current user session
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminClient = createAdminClient()
    
    // Delete the user from auth.users
    // This will trigger cascade deletes if foreign keys are set up correctly
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id)

    if (deleteError) {
      console.error("Error deleting user:", deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    // Sign out on the client side happens automatically if user is deleted,
    // but we return success so the frontend can redirect.
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Unexpected error during account deletion:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
