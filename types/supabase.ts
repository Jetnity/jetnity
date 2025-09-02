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
    PostgrestVersion: "12.2.3 (519615d)"
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
      app_admins: {
        Row: {
          user_id: string
        }
        Insert: {
          user_id: string
        }
        Update: {
          user_id?: string
        }
        Relationships: []
      }
      blog_comments: {
        Row: {
          blog_id: string | null
          content: string
          created_at: string
          id: string
          name: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          blog_id?: string | null
          content: string
          created_at?: string
          id?: string
          name?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          blog_id?: string | null
          content?: string
          created_at?: string
          id?: string
          name?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_comments_blog_id_fkey"
            columns: ["blog_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
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
          scheduled_at: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: Database["public"]["Enums"]["blog_status"]
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string | null
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
          scheduled_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: Database["public"]["Enums"]["blog_status"]
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id?: string | null
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
          scheduled_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["blog_status"]
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creator_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_alert_events: {
        Row: {
          current_value: number
          happened_at: string
          id: string
          message: string
          rule_id: string
          user_id: string
        }
        Insert: {
          current_value: number
          happened_at?: string
          id?: string
          message: string
          rule_id: string
          user_id: string
        }
        Update: {
          current_value?: number
          happened_at?: string
          id?: string
          message?: string
          rule_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_alert_events_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "creator_alert_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_alert_rules: {
        Row: {
          comparator: string
          content_type:
            | Database["public"]["Enums"]["creator_content_type"]
            | null
          created_at: string
          id: string
          is_active: boolean
          metric: string
          threshold: number
          title: string | null
          updated_at: string
          user_id: string
          window_days: number
        }
        Insert: {
          comparator: string
          content_type?:
            | Database["public"]["Enums"]["creator_content_type"]
            | null
          created_at?: string
          id?: string
          is_active?: boolean
          metric: string
          threshold: number
          title?: string | null
          updated_at?: string
          user_id: string
          window_days?: number
        }
        Update: {
          comparator?: string
          content_type?:
            | Database["public"]["Enums"]["creator_content_type"]
            | null
          created_at?: string
          id?: string
          is_active?: boolean
          metric?: string
          threshold?: number
          title?: string | null
          updated_at?: string
          user_id?: string
          window_days?: number
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
          role: string | null
          status: string
          tiktok: string | null
          twitter: string | null
          user_id: string | null
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
          role?: string | null
          status?: string
          tiktok?: string | null
          twitter?: string | null
          user_id?: string | null
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
          role?: string | null
          status?: string
          tiktok?: string | null
          twitter?: string | null
          user_id?: string | null
          username?: string | null
          website?: string | null
          youtube?: string | null
        }
        Relationships: []
      }
      creator_publish_events: {
        Row: {
          created_at: string
          id: string
          note: string | null
          rating: number | null
          reason: string | null
          scheduled_for: string | null
          session_id: string
          type: string
          visibility: string | null
          visibility_before: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          rating?: number | null
          reason?: string | null
          scheduled_for?: string | null
          session_id: string
          type: string
          visibility?: string | null
          visibility_before?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          rating?: number | null
          reason?: string | null
          scheduled_for?: string | null
          session_id?: string
          type?: string
          visibility?: string | null
          visibility_before?: string | null
        }
        Relationships: []
      }
      creator_publish_queue: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          platform: string
          result: Json | null
          scheduled_at: string | null
          session_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          platform: string
          result?: Json | null
          scheduled_at?: string | null
          session_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          platform?: string
          result?: Json | null
          scheduled_at?: string | null
          session_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_publish_queue_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "creator_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_publish_schedule: {
        Row: {
          attempts: number
          created_at: string
          id: string
          last_error: string | null
          note: string | null
          run_at: string
          session_id: string
          status: string
          updated_at: string
          visibility: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          id?: string
          last_error?: string | null
          note?: string | null
          run_at: string
          session_id: string
          status?: string
          updated_at?: string
          visibility: string
        }
        Update: {
          attempts?: number
          created_at?: string
          id?: string
          last_error?: string | null
          note?: string | null
          run_at?: string
          session_id?: string
          status?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: []
      }
      creator_session_metrics: {
        Row: {
          comments: number
          content_type: Database["public"]["Enums"]["creator_content_type"]
          created_at: string
          impact_score: number
          impressions: number
          likes: number
          session_id: string
          title: string | null
          user_id: string
          views: number
        }
        Insert: {
          comments?: number
          content_type?: Database["public"]["Enums"]["creator_content_type"]
          created_at?: string
          impact_score?: number
          impressions?: number
          likes?: number
          session_id?: string
          title?: string | null
          user_id: string
          views?: number
        }
        Update: {
          comments?: number
          content_type?: Database["public"]["Enums"]["creator_content_type"]
          created_at?: string
          impact_score?: number
          impressions?: number
          likes?: number
          session_id?: string
          title?: string | null
          user_id?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "creator_session_metrics_session_fk"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "creator_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_session_metrics_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "creator_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "csm_session_fk"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "creator_sessions"
            referencedColumns: ["id"]
          },
        ]
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
      creator_uploads: {
        Row: {
          city: string | null
          cover_url: string | null
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
          session_id: string | null
          slug: string | null
          tags: string[]
          title: string
          user_id: string | null
        }
        Insert: {
          city?: string | null
          cover_url?: string | null
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
          session_id?: string | null
          slug?: string | null
          tags: string[]
          title: string
          user_id?: string | null
        }
        Update: {
          city?: string | null
          cover_url?: string | null
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
          session_id?: string | null
          slug?: string | null
          tags?: string[]
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_uploads_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "creator_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      edit_docs: {
        Row: {
          created_at: string
          data: Json
          doc: Json
          id: string
          item_id: string
          session_id: string
          type: string
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          created_at?: string
          data?: Json
          doc: Json
          id?: string
          item_id: string
          session_id: string
          type: string
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          created_at?: string
          data?: Json
          doc?: Json
          id?: string
          item_id?: string
          session_id?: string
          type?: string
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "edit_docs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "creator_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_edit_docs_session"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "creator_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      media_versions: {
        Row: {
          created_at: string
          doc: Json
          edit_doc_id: string | null
          id: string
          item_id: string
          label: string
          session_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          doc?: Json
          edit_doc_id?: string | null
          id?: string
          item_id: string
          label: string
          session_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          doc?: Json
          edit_doc_id?: string | null
          id?: string
          item_id?: string
          label?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_versions_edit_doc_id_fkey"
            columns: ["edit_doc_id"]
            isOneToOne: false
            referencedRelation: "edit_docs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_versions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "creator_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      render_jobs: {
        Row: {
          created_at: string
          edit_doc_id: string | null
          edit_id: string
          error_message: string | null
          id: string
          job_type: string | null
          logs: string | null
          output_bucket: string | null
          output_path: string | null
          output_url: string | null
          params: Json | null
          preset: string
          progress: number
          result_url: string | null
          session_id: string
          status: string
          target: string
          updated_at: string
          user_id: string | null
          video_url: string | null
        }
        Insert: {
          created_at?: string
          edit_doc_id?: string | null
          edit_id: string
          error_message?: string | null
          id?: string
          job_type?: string | null
          logs?: string | null
          output_bucket?: string | null
          output_path?: string | null
          output_url?: string | null
          params?: Json | null
          preset: string
          progress?: number
          result_url?: string | null
          session_id: string
          status?: string
          target: string
          updated_at?: string
          user_id?: string | null
          video_url?: string | null
        }
        Update: {
          created_at?: string
          edit_doc_id?: string | null
          edit_id?: string
          error_message?: string | null
          id?: string
          job_type?: string | null
          logs?: string | null
          output_bucket?: string | null
          output_path?: string | null
          output_url?: string | null
          params?: Json | null
          preset?: string
          progress?: number
          result_url?: string | null
          session_id?: string
          status?: string
          target?: string
          updated_at?: string
          user_id?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "render_jobs_edit_id_fkey"
            columns: ["edit_id"]
            isOneToOne: false
            referencedRelation: "edit_docs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "render_jobs_editdoc_fkey"
            columns: ["edit_doc_id"]
            isOneToOne: false
            referencedRelation: "edit_docs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "render_jobs_session_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "creator_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "render_jobs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "creator_sessions"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "creator_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_comments: {
        Row: {
          created_at: string
          id: string
          meta: Json
          parent_id: string | null
          session_id: string
          text: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          meta?: Json
          parent_id?: string | null
          session_id: string
          text?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          meta?: Json
          parent_id?: string | null
          session_id?: string
          text?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "session_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_comments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "creator_sessions"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "creator_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_metrics: {
        Row: {
          completion_rate: number | null
          impressions: number | null
          prev_impressions: number | null
          prev_views: number | null
          session_id: string
          views: number | null
          watch_time_sec_total: number | null
        }
        Insert: {
          completion_rate?: number | null
          impressions?: number | null
          prev_impressions?: number | null
          prev_views?: number | null
          session_id: string
          views?: number | null
          watch_time_sec_total?: number | null
        }
        Update: {
          completion_rate?: number | null
          impressions?: number | null
          prev_impressions?: number | null
          prev_views?: number | null
          session_id?: string
          views?: number | null
          watch_time_sec_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "session_metrics_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "creator_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_metrics_daily: {
        Row: {
          date: string
          impressions: number | null
          session_id: string
          views: number | null
        }
        Insert: {
          date: string
          impressions?: number | null
          session_id: string
          views?: number | null
        }
        Update: {
          date?: string
          impressions?: number | null
          session_id?: string
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "session_metrics_daily_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "creator_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_review_requests: {
        Row: {
          admin_id: string
          created_at: string
          details: string | null
          due_date: string | null
          id: string
          reason: string | null
          session_id: string
          severity: string
          status: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          details?: string | null
          due_date?: string | null
          id?: string
          reason?: string | null
          session_id: string
          severity: string
          status?: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          details?: string | null
          due_date?: string | null
          id?: string
          reason?: string | null
          session_id?: string
          severity?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_review_requests_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "creator_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_saves: {
        Row: {
          created_at: string | null
          session_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          session_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_saves_session_id_fkey"
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
            referencedRelation: "creator_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_versions: {
        Row: {
          content: string | null
          created_at: string
          id: string
          meta: Json | null
          session_id: string
          title: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          meta?: Json | null
          session_id: string
          title?: string | null
          user_id?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          meta?: Json | null
          session_id?: string
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_versions_session_id_fkey"
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
            referencedRelation: "creator_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      append_email_to_array: {
        Args:
          | { email: string; session_id: string }
          | { email_to_add: string; id: string }
        Returns: string[]
      }
      creator_alerts_eval_all: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      creator_alerts_eval_current_user: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      creator_alerts_eval_for: {
        Args: { _uid: string }
        Returns: number
      }
      creator_impact_percentile: {
        Args: { _days: number } | { args: Json }
        Returns: {
          avg_impact: number
          pct: number
        }[]
      }
      creator_metrics_timeseries: {
        Args:
          | {
              _content_type?: Database["public"]["Enums"]["creator_content_type"]
              _days: number
            }
          | { args: Json }
        Returns: {
          comments: number
          d: string
          impressions: number
          likes: number
          views: number
        }[]
      }
      creator_posting_heatmap: {
        Args:
          | {
              _content_type?: Database["public"]["Enums"]["creator_content_type"]
              _days: number
            }
          | { args: Json }
        Returns: {
          comments: number
          dow: number
          hour: number
          impressions: number
          likes: number
          sessions: number
          views: number
        }[]
      }
      csm_increment_impressions: {
        Args: { p_session_id: string }
        Returns: undefined
      }
      csm_increment_views: {
        Args: { p_session_id: string }
        Returns: undefined
      }
      increment_impression: {
        Args: { session_id: string }
        Returns: undefined
      }
      increment_like: {
        Args: { session_id: string }
        Returns: undefined
      }
      increment_view: {
        Args: { session_id: string }
        Returns: undefined
      }
      platform_avg_impact_score: {
        Args: Record<PropertyKey, never> | { days?: number }
        Returns: number
      }
      publish_due_blog_posts: {
        Args: { batch_size?: number }
        Returns: {
          id: string
          scheduled_at: string
          title: string
          user_id: string
        }[]
      }
      publish_due_posts: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      remove_email_from_array: {
        Args: { email_to_remove: string; id: string }
        Returns: boolean
      }
      slugify: {
        Args: { "": string }
        Returns: string
      }
      sync_creator_profile_core: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      sync_creator_profile_emails: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      blog_status: "draft" | "published" | "scheduled" | "archived"
      creator_content_type:
        | "video"
        | "image"
        | "guide"
        | "blog"
        | "story"
        | "other"
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
      blog_status: ["draft", "published", "scheduled", "archived"],
      creator_content_type: [
        "video",
        "image",
        "guide",
        "blog",
        "story",
        "other",
      ],
      session_status: ["pending", "approved", "rejected"],
      visibility_status: ["private", "public"],
    },
  },
} as const
