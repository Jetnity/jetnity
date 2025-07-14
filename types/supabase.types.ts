export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export type Database = {
  public: {
    Tables: {

      // ✅ creator_sessions
      creator_sessions: {
        Row: {
          id: string
          title: string
          user_id: string
          role: string
          shared_with: string[]
          created_at: string
          status: string
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
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }

      // ✅ session_comments
      session_comments: {
        Row: {
          id: string
          session_id: string
          user_id: string
          content: string
          created_at: string
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

      // ✅ creator_uploads
      creator_uploads: {
        Row: {
          id: string
          user_id: string
          file_url: string
          type: string
          created_at: string
          session_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          file_url: string
          type: string
          created_at?: string
          session_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          file_url?: string
          type?: string
          created_at?: string
          session_id?: string | null
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
      // Beispiel: append_email_to_array
      append_email_to_array: {
        Args: {
          email: string
          session_id: string
        }
        Returns: string[]
      }
    }

    Enums: {}
  }
}
