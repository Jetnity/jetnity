// Erzeugt aus dem Supabase-Development-Branch mit `npm run db:typen`.
// Nicht von Hand ändern – Änderungen gehören in eine Migration.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      airports: {
        Row: {
          city: string | null
          country: string | null
          created_at: string | null
          iata: string | null
          icao: string | null
          id: number
          lat: number | null
          lon: number | null
          name: string
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          iata?: string | null
          icao?: string | null
          id?: number
          lat?: number | null
          lon?: number | null
          name: string
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          iata?: string | null
          icao?: string | null
          id?: number
          lat?: number | null
          lon?: number | null
          name?: string
        }
        Relationships: []
      }
      blocked_ips: {
        Row: {
          created_at: string
          ip: string
          reason: string | null
        }
        Insert: {
          created_at?: string
          ip: string
          reason?: string | null
        }
        Update: {
          created_at?: string
          ip?: string
          reason?: string | null
        }
        Relationships: []
      }
      creator_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          email: string | null
          facebook: string | null
          id: string
          instagram: string | null
          last_seen_at: string | null
          name: string | null
          role: string
          status: string
          tiktok: string | null
          twitter: string | null
          user_id: string
          username: string | null
          website: string | null
          youtube: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          facebook?: string | null
          id?: string
          instagram?: string | null
          last_seen_at?: string | null
          name?: string | null
          role?: string
          status?: string
          tiktok?: string | null
          twitter?: string | null
          user_id: string
          username?: string | null
          website?: string | null
          youtube?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          facebook?: string | null
          id?: string
          instagram?: string | null
          last_seen_at?: string | null
          name?: string | null
          role?: string
          status?: string
          tiktok?: string | null
          twitter?: string | null
          user_id?: string
          username?: string | null
          website?: string | null
          youtube?: string | null
        }
        Relationships: []
      }
      creator_sessions: {
        Row: {
          content: string | null
          created_at: string
          id: string
          idempotency_key: string | null
          insights: string | null
          published_at: string | null
          rating: number | null
          review_status: string
          role: string
          shared_with: string[] | null
          status: string
          title: string
          tracking: Json | null
          updated_at: string
          user_id: string
          visibility: Database["public"]["Enums"]["visibility_status"] | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          idempotency_key?: string | null
          insights?: string | null
          published_at?: string | null
          rating?: number | null
          review_status?: string
          role: string
          shared_with?: string[] | null
          status: string
          title: string
          tracking?: Json | null
          updated_at?: string
          user_id?: string
          visibility?: Database["public"]["Enums"]["visibility_status"] | null
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          idempotency_key?: string | null
          insights?: string | null
          published_at?: string | null
          rating?: number | null
          review_status?: string
          role?: string
          shared_with?: string[] | null
          status?: string
          title?: string
          tracking?: Json | null
          updated_at?: string
          user_id?: string
          visibility?: Database["public"]["Enums"]["visibility_status"] | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_chf: number | null
          created_at: string
          customer_email: string | null
          id: string
          status: string
        }
        Insert: {
          amount_chf?: number | null
          created_at?: string
          customer_email?: string | null
          id: string
          status: string
        }
        Update: {
          amount_chf?: number | null
          created_at?: string
          customer_email?: string | null
          id?: string
          status?: string
        }
        Relationships: []
      }
      refunds: {
        Row: {
          amount_chf: number
          created_at: string
          id: string
          payment_id: string
          reason: string | null
        }
        Insert: {
          amount_chf: number
          created_at?: string
          id?: string
          payment_id: string
          reason?: string | null
        }
        Update: {
          amount_chf?: number
          created_at?: string
          id?: string
          payment_id?: string
          reason?: string | null
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string
          extra: Json | null
          id: string
          ip: string | null
          metadata: Json | null
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          extra?: Json | null
          id?: string
          ip?: string | null
          metadata?: Json | null
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          extra?: Json | null
          id?: string
          ip?: string | null
          metadata?: Json | null
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      stripe_webhooks: {
        Row: {
          created_at: string
          id: string
          type: string | null
        }
        Insert: {
          created_at?: string
          id: string
          type?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          type?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_payments_summary_30d: {
        Args: never
        Returns: {
          orders_count: number
          payouts_cents: number
          refunds_cents: number
          total_revenue_cents: number
        }[]
      }
      admin_security_overview: {
        Args: never
        Returns: {
          policy_count: number
          rls_enabled: boolean
          table_name: string
        }[]
      }
      aktuelle_rolle: { Args: never; Returns: string }
      append_email_to_array:
        | { Args: { email: string; session_id: string }; Returns: string[] }
        | { Args: { email_to_add: string; id: string }; Returns: boolean }
      darf_betrieb_eingreifen: { Args: never; Returns: boolean }
      darf_betrieb_lesen: { Args: never; Returns: boolean }
      darf_inhalte_moderieren: { Args: never; Returns: boolean }
      darf_konfiguration_verwalten: { Args: never; Returns: boolean }
      darf_konten_verwalten: { Args: never; Returns: boolean }
      hat_rolle_mindestens: { Args: { minimum: string }; Returns: boolean }
      remove_email_from_array: {
        Args: { email_to_remove: string; id: string }
        Returns: boolean
      }
      rollenrang: { Args: { rolle: string }; Returns: number }
      sync_creator_profile_core: { Args: never; Returns: undefined }
      sync_creator_profile_emails: { Args: never; Returns: undefined }
    }
    Enums: {
      session_status: "pending" | "approved" | "rejected"
      visibility_status: "private" | "public"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      session_status: ["pending", "approved", "rejected"],
      visibility_status: ["private", "public"],
    },
  },
} as const
