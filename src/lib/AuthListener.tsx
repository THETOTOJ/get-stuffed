"use client"
import { useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"

export default function AuthListener() {
  useEffect(() => {
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(() => {
      // Keep session in sync
    })

    return () => subscription.unsubscribe()
  }, [])

  return null
}
