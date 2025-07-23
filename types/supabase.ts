export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      blog_posts: {
        Row: {
          admin_reviewed: boolean
          ai_generated: boolean
          content: string
          cover_image: string | null
          created_at: string | null
          creator_id: string | null
          excerpt: string | null
          id: string
          is_featured: boolean
          likes: number
          published_at: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string | null
          views: number
        }
        Insert: {
          admin_reviewed?: boolean
          ai_generated?: boolean
          content: string
          cover_image?: string | null
          created_at?: string | null
          creator_id?: string | null
          excerpt?: string | null
          id?: string
          is_featured?: boolean
          likes?: number
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
          views?: number
        }
        Update: {
          admin_reviewed?: boolean
          ai_generated?: boolean
          content?: string
          cover_image?: string | null
          created_at?: string | null
          creator_id?: string | null
          excerpt?: string | null
          id?: string
          is_featured?: boolean
          likes?: number
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          views?: number
        }
        Relationships: []
      }
      creator_profiles: {
        Row: {
          created_at: string | null
          id: string
          role: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      creator_sessions: {
        Row: {
          content: string | null
          created_at: string
          id: string
          insights: string | null
          published_at: string | null
          rating: number | null
          role: string
          shared_with: Json
          status: string
          title: string
          user_id: string
          visibility: Database["public"]["Enums"]["visibility_status"] | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          insights?: string | null
          published_at?: string | null
          rating?: number | null
          role: string
          shared_with: Json
          status: string
          title: string
          user_id?: string
          visibility?: Database["public"]["Enums"]["visibility_status"] | null
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          insights?: string | null
          published_at?: string | null
          rating?: number | null
          role?: string
          shared_with?: Json
          status?: string
          title?: string
          user_id?: string
          visibility?: Database["public"]["Enums"]["visibility_status"] | null
        }
        Relationships: []
      }
      creator_uploads: {
        Row: {
          created_at: string
          creator_avatar: string | null
          creator_name: string | null
          description: string
          destination: string | null
          file_url: string
          format: string | null
          id: string
          image_url: string | null
          is_virtual: boolean | null
          language: string
          mood: string | null
          region: string
          tags: string[]
          title: string
          user_id: string | null
        }
        Insert: {
          created_at: string
          creator_avatar?: string | null
          creator_name?: string | null
          description: string
          destination?: string | null
          file_url: string
          format?: string | null
          id?: string
          image_url?: string | null
          is_virtual?: boolean | null
          language: string
          mood?: string | null
          region: string
          tags: string[]
          title: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          creator_avatar?: string | null
          creator_name?: string | null
          description?: string
          destination?: string | null
          file_url?: string
          format?: string | null
          id?: string
          image_url?: string | null
          is_virtual?: boolean | null
          language?: string
          mood?: string | null
          region?: string
          tags?: string[]
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      session_cocreations: {
        Row: {
          content: string
          created_at: string | null
          id: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_cocreations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "creator_session_metrics"
            referencedColumns: ["session_id"]
          },
          {
            foreignKeyName: "session_cocreations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "creator_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_comments: {
        Row: {
          created_at: string
          id: string
          session_id: string
          text: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          session_id: string
          text?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          session_id?: string
          text?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      session_impressions: {
        Row: {
          created_at: string | null
          id: string
          session_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          session_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          session_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_impressions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "creator_session_metrics"
            referencedColumns: ["session_id"]
          },
          {
            foreignKeyName: "session_impressions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "creator_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_media: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_url: string
          is_ai_generated: boolean | null
          session_id: string | null
          tags: string[] | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url: string
          is_ai_generated?: boolean | null
          session_id?: string | null
          tags?: string[] | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string
          is_ai_generated?: boolean | null
          session_id?: string | null
          tags?: string[] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_media_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "creator_session_metrics"
            referencedColumns: ["session_id"]
          },
          {
            foreignKeyName: "session_media_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "creator_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_snippets: {
        Row: {
          content: string
          created_at: string | null
          id: string
          session_id: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          session_id?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          session_id?: string | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_snippets_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "creator_session_metrics"
            referencedColumns: ["session_id"]
          },
          {
            foreignKeyName: "session_snippets_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "creator_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_stories: {
        Row: {
          content: string
          created_at: string | null
          id: string
          section: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          section: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          section?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_stories_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "creator_session_metrics"
            referencedColumns: ["session_id"]
          },
          {
            foreignKeyName: "session_stories_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "creator_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_views: {
        Row: {
          created_at: string | null
          id: string
          session_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          session_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          session_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_views_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "creator_session_metrics"
            referencedColumns: ["session_id"]
          },
          {
            foreignKeyName: "session_views_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "creator_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      creator_session_metrics: {
        Row: {
          comments: number | null
          impact_score: number | null
          impressions: number | null
          session_id: string | null
          views: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      append_email_to_array: {
        Args: { id: string; email_to_add: string }
        Returns: undefined
      }
      increment_impression: {
        Args: { session_id_input: string }
        Returns: undefined
      }
      increment_view: {
        Args: { session_id_input: string }
        Returns: undefined
      }
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
