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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      airports: {
        Row: {
          city: string | null
          country: string | null
          country_code: string | null
          created_at: string | null
          iata: string | null
          icao: string | null
          id: number
          keywords: string | null
          klasse: string | null
          lat: number | null
          lon: number | null
          name: string
          region: string | null
          updated_at: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string | null
          iata?: string | null
          icao?: string | null
          id?: number
          keywords?: string | null
          klasse?: string | null
          lat?: number | null
          lon?: number | null
          name: string
          region?: string | null
          updated_at?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string | null
          iata?: string | null
          icao?: string | null
          id?: number
          keywords?: string | null
          klasse?: string | null
          lat?: number | null
          lon?: number | null
          name?: string
          region?: string | null
          updated_at?: string | null
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
      model_usage: {
        Row: {
          abgeschlossen_am: string | null
          art: string
          ausgabe_tokens: number | null
          created_at: string
          eingabe_tokens: number | null
          ergebnis: string
          funktion: string
          gecachte_tokens: number | null
          id: string
          kennung_hash: string
          kosten_mikro_usd: number
          laufzeit_ms: number | null
          modell: string
        }
        Insert: {
          abgeschlossen_am?: string | null
          art: string
          ausgabe_tokens?: number | null
          created_at?: string
          eingabe_tokens?: number | null
          ergebnis?: string
          funktion: string
          gecachte_tokens?: number | null
          id?: string
          kennung_hash: string
          kosten_mikro_usd: number
          laufzeit_ms?: number | null
          modell: string
        }
        Update: {
          abgeschlossen_am?: string | null
          art?: string
          ausgabe_tokens?: number | null
          created_at?: string
          eingabe_tokens?: number | null
          ergebnis?: string
          funktion?: string
          gecachte_tokens?: number | null
          id?: string
          kennung_hash?: string
          kosten_mikro_usd?: number
          laufzeit_ms?: number | null
          modell?: string
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
      places: {
        Row: {
          country: string | null
          country_code: string | null
          iata: string | null
          id: string
          keywords: string | null
          lat: number | null
          lon: number | null
          name: string
          region: string | null
          source: string
          source_id: string
          typ: string
          updated_at: string | null
        }
        Insert: {
          country?: string | null
          country_code?: string | null
          iata?: string | null
          id: string
          keywords?: string | null
          lat?: number | null
          lon?: number | null
          name: string
          region?: string | null
          source: string
          source_id: string
          typ: string
          updated_at?: string | null
        }
        Update: {
          country?: string | null
          country_code?: string | null
          iata?: string | null
          id?: string
          keywords?: string | null
          lat?: number | null
          lon?: number | null
          name?: string
          region?: string | null
          source?: string
          source_id?: string
          typ?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          email: string | null
          id: string
          last_seen_at: string | null
          role: string
          status: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          last_seen_at?: string | null
          role?: string
          status?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          last_seen_at?: string | null
          role?: string
          status?: string
          user_id?: string
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
      trip_days: {
        Row: {
          created_at: string
          day_date: string | null
          day_index: number
          id: string
          metadata: Json
          stage_id: string | null
          title: string | null
          trip_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day_date?: string | null
          day_index: number
          id?: string
          metadata?: Json
          stage_id?: string | null
          title?: string | null
          trip_id: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          day_date?: string | null
          day_index?: number
          id?: string
          metadata?: Json
          stage_id?: string | null
          title?: string | null
          trip_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_days_etappe_fk"
            columns: ["stage_id", "trip_id"]
            isOneToOne: false
            referencedRelation: "trip_stages"
            referencedColumns: ["id", "trip_id"]
          },
          {
            foreignKeyName: "trip_days_reise_fk"
            columns: ["trip_id", "user_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      trip_items: {
        Row: {
          booking_confirmed_at: string | null
          booking_source: string | null
          booking_status: string
          booking_url: string | null
          connection_ref: string | null
          created_at: string
          day_id: string | null
          destination_name: string | null
          destination_place_id: string | null
          ends_at: string | null
          ends_on: string | null
          external_ref: string | null
          id: string
          kind: string
          metadata: Json
          mobility_changes: number | null
          mobility_evidence: string | null
          mobility_mode: string | null
          note: string | null
          origin_name: string | null
          origin_place_id: string | null
          position: number
          price_amount: number | null
          price_currency: string | null
          provider: string | null
          rental_evidence: string | null
          rental_supplier: string | null
          stage_id: string | null
          starts_at: string | null
          starts_on: string | null
          time_zone: string | null
          title: string
          transmission: string | null
          trip_id: string
          updated_at: string
          user_id: string
          vehicle_class: string | null
        }
        Insert: {
          booking_confirmed_at?: string | null
          booking_source?: string | null
          booking_status?: string
          booking_url?: string | null
          connection_ref?: string | null
          created_at?: string
          day_id?: string | null
          destination_name?: string | null
          destination_place_id?: string | null
          ends_at?: string | null
          ends_on?: string | null
          external_ref?: string | null
          id?: string
          kind: string
          metadata?: Json
          mobility_changes?: number | null
          mobility_evidence?: string | null
          mobility_mode?: string | null
          note?: string | null
          origin_name?: string | null
          origin_place_id?: string | null
          position?: number
          price_amount?: number | null
          price_currency?: string | null
          provider?: string | null
          rental_evidence?: string | null
          rental_supplier?: string | null
          stage_id?: string | null
          starts_at?: string | null
          starts_on?: string | null
          time_zone?: string | null
          title: string
          transmission?: string | null
          trip_id: string
          updated_at?: string
          user_id?: string
          vehicle_class?: string | null
        }
        Update: {
          booking_confirmed_at?: string | null
          booking_source?: string | null
          booking_status?: string
          booking_url?: string | null
          connection_ref?: string | null
          created_at?: string
          day_id?: string | null
          destination_name?: string | null
          destination_place_id?: string | null
          ends_at?: string | null
          ends_on?: string | null
          external_ref?: string | null
          id?: string
          kind?: string
          metadata?: Json
          mobility_changes?: number | null
          mobility_evidence?: string | null
          mobility_mode?: string | null
          note?: string | null
          origin_name?: string | null
          origin_place_id?: string | null
          position?: number
          price_amount?: number | null
          price_currency?: string | null
          provider?: string | null
          rental_evidence?: string | null
          rental_supplier?: string | null
          stage_id?: string | null
          starts_at?: string | null
          starts_on?: string | null
          time_zone?: string | null
          title?: string
          transmission?: string | null
          trip_id?: string
          updated_at?: string
          user_id?: string
          vehicle_class?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_items_etappe_fk"
            columns: ["stage_id", "trip_id"]
            isOneToOne: false
            referencedRelation: "trip_stages"
            referencedColumns: ["id", "trip_id"]
          },
          {
            foreignKeyName: "trip_items_reise_fk"
            columns: ["trip_id", "user_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "trip_items_tag_fk"
            columns: ["day_id", "trip_id"]
            isOneToOne: false
            referencedRelation: "trip_days"
            referencedColumns: ["id", "trip_id"]
          },
        ]
      }
      trip_readiness_items: {
        Row: {
          client_ref: string
          context_fingerprint: string
          country_code: string | null
          created_at: string
          evidence: string
          id: string
          kind: string
          title: string | null
          trip_id: string
          trip_item_id: string | null
          updated_at: string
          user_id: string
          user_status: string
        }
        Insert: {
          client_ref: string
          context_fingerprint: string
          country_code?: string | null
          created_at?: string
          evidence?: string
          id?: string
          kind: string
          title?: string | null
          trip_id: string
          trip_item_id?: string | null
          updated_at?: string
          user_id?: string
          user_status?: string
        }
        Update: {
          client_ref?: string
          context_fingerprint?: string
          country_code?: string | null
          created_at?: string
          evidence?: string
          id?: string
          kind?: string
          title?: string | null
          trip_id?: string
          trip_item_id?: string | null
          updated_at?: string
          user_id?: string
          user_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_readiness_items_punkt_fk"
            columns: ["trip_item_id", "trip_id", "user_id"]
            isOneToOne: false
            referencedRelation: "trip_items"
            referencedColumns: ["id", "trip_id", "user_id"]
          },
          {
            foreignKeyName: "trip_readiness_items_reise_fk"
            columns: ["trip_id", "user_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      trip_travellers: {
        Row: {
          client_ref: string
          created_at: string
          document_expires_on: string | null
          document_issuing_country_code: string | null
          document_type: string | null
          id: string
          label: string | null
          nationality_country_code: string | null
          residence_country_code: string | null
          trip_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_ref: string
          created_at?: string
          document_expires_on?: string | null
          document_issuing_country_code?: string | null
          document_type?: string | null
          id?: string
          label?: string | null
          nationality_country_code?: string | null
          residence_country_code?: string | null
          trip_id: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          client_ref?: string
          created_at?: string
          document_expires_on?: string | null
          document_issuing_country_code?: string | null
          document_type?: string | null
          id?: string
          label?: string | null
          nationality_country_code?: string | null
          residence_country_code?: string | null
          trip_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_travellers_reise_fk"
            columns: ["trip_id", "user_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      trip_stages: {
        Row: {
          arrival_date: string | null
          country_code: string | null
          created_at: string
          departure_date: string | null
          id: string
          latitude: number | null
          longitude: number | null
          metadata: Json
          name: string
          place_id: string | null
          position: number
          trip_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          arrival_date?: string | null
          country_code?: string | null
          created_at?: string
          departure_date?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          metadata?: Json
          name: string
          place_id?: string | null
          position?: number
          trip_id: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          arrival_date?: string | null
          country_code?: string | null
          created_at?: string
          departure_date?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          metadata?: Json
          name?: string
          place_id?: string | null
          position?: number
          trip_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_stages_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_stages_reise_fk"
            columns: ["trip_id", "user_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      trips: {
        Row: {
          budget_amount: number | null
          client_ref: string
          created_at: string
          currency: string
          end_date: string | null
          id: string
          interests: string[]
          last_mutation_id: string | null
          metadata: Json
          origin: string | null
          origin_place_id: string | null
          pace: string
          revision: number
          start_date: string | null
          status: string
          title: string
          travel_wish: string | null
          travellers: number
          updated_at: string
          user_id: string
        }
        Insert: {
          budget_amount?: number | null
          client_ref: string
          created_at?: string
          currency?: string
          end_date?: string | null
          id?: string
          interests?: string[]
          last_mutation_id?: string | null
          metadata?: Json
          origin?: string | null
          origin_place_id?: string | null
          pace?: string
          revision?: number
          start_date?: string | null
          status?: string
          title: string
          travel_wish?: string | null
          travellers?: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          budget_amount?: number | null
          client_ref?: string
          created_at?: string
          currency?: string
          end_date?: string | null
          id?: string
          interests?: string[]
          last_mutation_id?: string | null
          metadata?: Json
          origin?: string | null
          origin_place_id?: string | null
          pace?: string
          revision?: number
          start_date?: string | null
          status?: string
          title?: string
          travel_wish?: string | null
          travellers?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_origin_place_id_fkey"
            columns: ["origin_place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
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
      admin_reisen_kennzahlen: {
        Args: never
        Returns: {
          konten_mit_reise_30d: number
          reisen_30d: number
          reisen_gesamt: number
        }[]
      }
      admin_reisen_zeitreihe: {
        Args: { _tage?: number }
        Returns: {
          anzahl: number
          tag: string
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
      darf_betrieb_eingreifen: { Args: never; Returns: boolean }
      darf_betrieb_lesen: { Args: never; Returns: boolean }
      darf_inhalte_moderieren: { Args: never; Returns: boolean }
      darf_konfiguration_verwalten: { Args: never; Returns: boolean }
      darf_konten_verwalten: { Args: never; Returns: boolean }
      hat_rolle_mindestens: { Args: { minimum: string }; Returns: boolean }
      liste_ohne_doppelte: { Args: { _werte: string[] }; Returns: boolean }
      modell_kontingent_beanspruchen: {
        Args: {
          _funktion: string
          _gastkennung?: string
          _konto?: string
          _modell: string
        }
        Returns: string
      }
      modell_nutzung_abschliessen: {
        Args: {
          _ausgabe_tokens?: number
          _eingabe_tokens?: number
          _ergebnis: string
          _gecachte_tokens?: number
          _id: string
          _laufzeit_ms?: number
        }
        Returns: undefined
      }
      modell_preis: {
        Args: { _modell: string }
        Returns: {
          ausgabe: number
          eingabe: number
          eingabe_gecacht: number
        }[]
      }
      reise_aendern: { Args: { _aenderung: Json }; Returns: Json }
      reise_anlegen: { Args: { _reise: Json }; Returns: string }
      rollenrang: { Args: { rolle: string }; Returns: number }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
