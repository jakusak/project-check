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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      equipment_items: {
        Row: {
          availability: boolean
          category: string
          created_at: string
          id: string
          image_url: string | null
          name: string
          regions: string[] | null
          sku: string
        }
        Insert: {
          availability?: boolean
          category: string
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          regions?: string[] | null
          sku: string
        }
        Update: {
          availability?: boolean
          category?: string
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          regions?: string[] | null
          sku?: string
        }
        Relationships: []
      }
      equipment_request_events: {
        Row: {
          actor_user_id: string
          created_at: string
          event_notes: string | null
          event_type: string
          id: string
          new_values: Json | null
          old_values: Json | null
          request_id: string
        }
        Insert: {
          actor_user_id: string
          created_at?: string
          event_notes?: string | null
          event_type: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          request_id: string
        }
        Update: {
          actor_user_id?: string
          created_at?: string
          event_notes?: string | null
          event_type?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_request_events_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "equipment_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_request_line_items: {
        Row: {
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          decline_reason: string | null
          equipment_id: string
          id: string
          modified_by_opx: string | null
          original_quantity: number | null
          quantity: number
          reason: string | null
          request_id: string
        }
        Insert: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          decline_reason?: string | null
          equipment_id: string
          id?: string
          modified_by_opx?: string | null
          original_quantity?: number | null
          quantity: number
          reason?: string | null
          request_id: string
        }
        Update: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          decline_reason?: string | null
          equipment_id?: string
          id?: string
          modified_by_opx?: string | null
          original_quantity?: number | null
          quantity?: number
          reason?: string | null
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_request_line_items_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_request_line_items_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "equipment_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_requests: {
        Row: {
          created_at: string
          delivery_region: string
          hub: string | null
          id: string
          notes: string | null
          ops_area: string | null
          opx_notes: string | null
          opx_reviewed_at: string | null
          opx_reviewed_by: string | null
          opx_status: string | null
          rationale: string | null
          required_by_date: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delivery_region: string
          hub?: string | null
          id?: string
          notes?: string | null
          ops_area?: string | null
          opx_notes?: string | null
          opx_reviewed_at?: string | null
          opx_reviewed_by?: string | null
          opx_status?: string | null
          rationale?: string | null
          required_by_date: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          delivery_region?: string
          hub?: string | null
          id?: string
          notes?: string | null
          ops_area?: string | null
          opx_notes?: string | null
          opx_reviewed_at?: string | null
          opx_reviewed_by?: string | null
          opx_status?: string | null
          rationale?: string | null
          required_by_date?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      hub_admin_assignments: {
        Row: {
          assigned_by: string | null
          created_at: string
          hub: string
          id: string
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          hub: string
          id?: string
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          hub?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      inventory_sync_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          hub: string
          id: string
          item_id: string
          netsuite_transaction_id: string | null
          quantity: number
          request_id: string
          status: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          hub: string
          id?: string
          item_id: string
          netsuite_transaction_id?: string | null
          quantity: number
          request_id: string
          status: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          hub?: string
          id?: string
          item_id?: string
          netsuite_transaction_id?: string | null
          quantity?: number
          request_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_sync_logs_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "equipment_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_sync_logs_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "equipment_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      ops_area_to_hub: {
        Row: {
          created_at: string | null
          hub: string
          id: string
          ops_area: string
          region: string | null
        }
        Insert: {
          created_at?: string | null
          hub: string
          id?: string
          ops_area: string
          region?: string | null
        }
        Update: {
          created_at?: string | null
          hub?: string
          id?: string
          ops_area?: string
          region?: string | null
        }
        Relationships: []
      }
      opx_area_assignments: {
        Row: {
          assigned_by: string | null
          created_at: string
          id: string
          ops_area: string
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          ops_area: string
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          ops_area?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          name: string
          photo_url: string | null
          team: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          name: string
          photo_url?: string | null
          team: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          name?: string
          photo_url?: string | null
          team?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      unit_loads: {
        Row: {
          comment: string | null
          created_at: string
          extra: number | null
          family: string | null
          hub: string
          id: string
          load_date: string | null
          loader: string | null
          main: number | null
          no_van: number | null
          ops_area: string
          opx_flo: string | null
          support: number | null
          trailer_number: string | null
          unit: string
          unit_type: string | null
          updated_at: string
          van_number: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          extra?: number | null
          family?: string | null
          hub: string
          id?: string
          load_date?: string | null
          loader?: string | null
          main?: number | null
          no_van?: number | null
          ops_area: string
          opx_flo?: string | null
          support?: number | null
          trailer_number?: string | null
          unit: string
          unit_type?: string | null
          updated_at?: string
          van_number?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          extra?: number | null
          family?: string | null
          hub?: string
          id?: string
          load_date?: string | null
          loader?: string | null
          main?: number | null
          no_van?: number | null
          ops_area?: string
          opx_flo?: string | null
          support?: number | null
          trailer_number?: string | null
          unit?: string
          unit_type?: string | null
          updated_at?: string
          van_number?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      van_incident_files: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_type: string
          id: string
          incident_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_type: string
          id?: string
          incident_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_type?: string
          id?: string
          incident_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "van_incident_files_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "van_incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      van_incidents: {
        Row: {
          created_at: string
          created_by_user_id: string
          description: string
          id: string
          incident_date: string
          incident_time: string
          internal_notes: string | null
          license_plate: string
          location_text: string
          ops_admin_user_id: string | null
          ops_area: string
          status: Database["public"]["Enums"]["incident_status"]
          trip_id: string | null
          updated_at: string
          van_id: string
          vin: string
          weather: string
        }
        Insert: {
          created_at?: string
          created_by_user_id: string
          description: string
          id?: string
          incident_date: string
          incident_time: string
          internal_notes?: string | null
          license_plate: string
          location_text: string
          ops_admin_user_id?: string | null
          ops_area: string
          status?: Database["public"]["Enums"]["incident_status"]
          trip_id?: string | null
          updated_at?: string
          van_id: string
          vin: string
          weather: string
        }
        Update: {
          created_at?: string
          created_by_user_id?: string
          description?: string
          id?: string
          incident_date?: string
          incident_time?: string
          internal_notes?: string | null
          license_plate?: string
          location_text?: string
          ops_admin_user_id?: string | null
          ops_area?: string
          status?: Database["public"]["Enums"]["incident_status"]
          trip_id?: string | null
          updated_at?: string
          van_id?: string
          vin?: string
          weather?: string
        }
        Relationships: [
          {
            foreignKeyName: "van_incidents_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "van_incidents_ops_admin_user_id_fkey"
            columns: ["ops_admin_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_notification: {
        Args: {
          _link?: string
          _message: string
          _title: string
          _type?: string
          _user_id: string
        }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "user"
        | "field_staff"
        | "opx"
        | "hub_admin"
        | "super_admin"
      incident_status: "submitted" | "in_review" | "closed"
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
      app_role: [
        "admin",
        "user",
        "field_staff",
        "opx",
        "hub_admin",
        "super_admin",
      ],
      incident_status: ["submitted", "in_review", "closed"],
    },
  },
} as const
