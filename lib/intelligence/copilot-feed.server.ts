import { createServerComponentClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function getTrendingUploads(limit = 6) {
  const supabase = createServerComponentClient({ cookies: cookies() })

  const { data, error } = await supabase
    .from("creator_uploads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error || !data) return []

  return data
}
