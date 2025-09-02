// types/supabase.types.ts
// -------------------------------------------------------------
// Handgepflegte Supabase-Typen (public-Schema) + Komfort-Helper
// -------------------------------------------------------------

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

// -------------------------------------------------------------
// Hauptschema
// -------------------------------------------------------------
export type Database = {
  public: {
    Tables: {

      // ========= creator_sessions ==========================================
      creator_sessions: {
        Row: {
          id: string // uuid
          title: string
          user_id: string // uuid (auth.users.id)
          role: string // z.B. 'owner' | 'editor' | 'viewer'
          shared_with: string[] // E-Mails oder User-IDs
          created_at: string // timestamptz ISO
          status: string // z.B. 'draft' | 'active' | 'archived'
        }
        Insert: {
          id?: string
          title: string
          user_id?: string
          role?: string
          shared_with?: string[]
          created_at?: string
          status?: string
        }
        Update: {
          id?: string
          title?: string
          user_id?: string
          role?: string
          shared_with?: string[]
          created_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: 'creator_sessions_user_id_fkey'
            columns: ['user_id']
            // In Supabase ist die User-Tabelle i. d. R. "auth.users"
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }

      // ========= session_comments ==========================================
      session_comments: {
        Row: {
          id: string // uuid
          session_id: string // uuid
          user_id: string // uuid
          content: string
          created_at: string // timestamptz
        }
        Insert: {
          id?: string
          session_id: string
          user_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          user_id?: string
          content?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'session_comments_session_id_fkey'
            columns: ['session_id']
            referencedRelation: 'creator_sessions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'session_comments_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }

      // ========= creator_uploads ===========================================
      // WICHTIG: Diese Spalten sind an deinen Code angepasst (Copilot-Pro Features)
      creator_uploads: {
        Row: {
          id: string // uuid
          user_id: string // uuid
          // Basis-Dateiinfos
          file_url: string | null
          type: string | null // z.B. 'image' | 'video' | 'audio' | 'doc'
          format: string | null // z.B. 'jpg' | 'png' | 'mp4'
          // Content / Anzeige
          title: string | null
          slug: string | null
          description: string | null
          destination: string | null // z.B. Reiseziel
          region: string | null // wird von maybeGenerateCopilotUpload() verwendet
          tags: string[] | null // oder JSONB in DB → dann Json | null
          // Virtuelle Creator
          creator_name: string | null
          creator_avatar: string | null
          is_virtual: boolean | null
          // Bilder
          image_url: string | null
          cover_url: string | null
          // Session-Link
          session_id: string | null // uuid
          // Audit
          created_at: string // timestamptz
        }
        Insert: {
          id?: string
          user_id: string
          file_url?: string | null
          type?: string | null
          format?: string | null
          title?: string | null
          slug?: string | null
          description?: string | null
          destination?: string | null
          region?: string | null
          tags?: string[] | null
          creator_name?: string | null
          creator_avatar?: string | null
          is_virtual?: boolean | null
          image_url?: string | null
          cover_url?: string | null
          session_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          file_url?: string | null
          type?: string | null
          format?: string | null
          title?: string | null
          slug?: string | null
          description?: string | null
          destination?: string | null
          region?: string | null
          tags?: string[] | null
          creator_name?: string | null
          creator_avatar?: string | null
          is_virtual?: boolean | null
          image_url?: string | null
          cover_url?: string | null
          session_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'creator_uploads_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'creator_uploads_session_id_fkey'
            columns: ['session_id']
            referencedRelation: 'creator_sessions'
            referencedColumns: ['id']
          }
        ]
      }

    }

    Views: {}

    Functions: {
      // Beispiel-Funktion (falls vorhanden)
      append_email_to_array: {
        Args: { email: string; session_id: string }
        Returns: string[]
      }
    }

    Enums: {
      // Wenn du CHECK-Constraints als Enums abbildest, z. B.:
      // upload_type: 'image' | 'video' | 'audio' | 'doc'
      // session_status: 'draft' | 'active' | 'archived'
    }
  }
}

// -------------------------------------------------------------
// Komfort-Helper (wie beim Supabase Codegen)
// -------------------------------------------------------------
type PublicSchema = Database['public']

export type Tables<
  T extends keyof PublicSchema['Tables']
> = PublicSchema['Tables'][T]['Row']

export type TablesInsert<
  T extends keyof PublicSchema['Tables']
> = PublicSchema['Tables'][T]['Insert']

export type TablesUpdate<
  T extends keyof PublicSchema['Tables']
> = PublicSchema['Tables'][T]['Update']

export type Enums<
  T extends keyof PublicSchema['Enums']
> = PublicSchema['Enums'][T]

// Optional nützlich:
export type RowNames = keyof PublicSchema['Tables']
export type FunctionNames = keyof PublicSchema['Functions']
