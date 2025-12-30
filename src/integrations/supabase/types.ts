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
      bike_assignments: {
        Row: {
          assigned_by_user_id: string
          bike_sku: string
          bike_unique_id: string
          created_at: string
          equipment_item_id: string | null
          guest_reservation_id: string
          id: string
          notes: string | null
          returned_at: string | null
          status: string
          trip_id: string
          updated_at: string
        }
        Insert: {
          assigned_by_user_id: string
          bike_sku: string
          bike_unique_id: string
          created_at?: string
          equipment_item_id?: string | null
          guest_reservation_id: string
          id?: string
          notes?: string | null
          returned_at?: string | null
          status?: string
          trip_id: string
          updated_at?: string
        }
        Update: {
          assigned_by_user_id?: string
          bike_sku?: string
          bike_unique_id?: string
          created_at?: string
          equipment_item_id?: string | null
          guest_reservation_id?: string
          id?: string
          notes?: string | null
          returned_at?: string | null
          status?: string
          trip_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bike_assignments_equipment_item_id_fkey"
            columns: ["equipment_item_id"]
            isOneToOne: false
            referencedRelation: "equipment_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bike_assignments_guest_reservation_id_fkey"
            columns: ["guest_reservation_id"]
            isOneToOne: false
            referencedRelation: "guest_reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bike_assignments_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      broken_item_reports: {
        Row: {
          created_at: string
          created_by_user_id: string
          description: string
          equipment_item_id: string | null
          id: string
          location_name: string
          ops_area: string
          photo_path: string | null
          severity: Database["public"]["Enums"]["broken_item_severity"]
          sku: string
          status: Database["public"]["Enums"]["broken_item_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_user_id: string
          description: string
          equipment_item_id?: string | null
          id?: string
          location_name: string
          ops_area: string
          photo_path?: string | null
          severity?: Database["public"]["Enums"]["broken_item_severity"]
          sku: string
          status?: Database["public"]["Enums"]["broken_item_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_user_id?: string
          description?: string
          equipment_item_id?: string | null
          id?: string
          location_name?: string
          ops_area?: string
          photo_path?: string | null
          severity?: Database["public"]["Enums"]["broken_item_severity"]
          sku?: string
          status?: Database["public"]["Enums"]["broken_item_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "broken_item_reports_equipment_item_id_fkey"
            columns: ["equipment_item_id"]
            isOneToOne: false
            referencedRelation: "equipment_items"
            referencedColumns: ["id"]
          },
        ]
      }
      cycle_count_events: {
        Row: {
          actor_user_id: string
          created_at: string
          cycle_count_id: string
          event_notes: string | null
          event_type: string
          id: string
          new_values: Json | null
          old_values: Json | null
        }
        Insert: {
          actor_user_id: string
          created_at?: string
          cycle_count_id: string
          event_notes?: string | null
          event_type: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
        }
        Update: {
          actor_user_id?: string
          created_at?: string
          cycle_count_id?: string
          event_notes?: string | null
          event_type?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "cycle_count_events_cycle_count_id_fkey"
            columns: ["cycle_count_id"]
            isOneToOne: false
            referencedRelation: "cycle_counts"
            referencedColumns: ["id"]
          },
        ]
      }
      cycle_count_lines: {
        Row: {
          created_at: string
          cycle_count_id: string
          equipment_item_id: string | null
          id: string
          notes: string | null
          photo_path: string | null
          recorded_qty: number
          sku: string
        }
        Insert: {
          created_at?: string
          cycle_count_id: string
          equipment_item_id?: string | null
          id?: string
          notes?: string | null
          photo_path?: string | null
          recorded_qty: number
          sku: string
        }
        Update: {
          created_at?: string
          cycle_count_id?: string
          equipment_item_id?: string | null
          id?: string
          notes?: string | null
          photo_path?: string | null
          recorded_qty?: number
          sku?: string
        }
        Relationships: [
          {
            foreignKeyName: "cycle_count_lines_cycle_count_id_fkey"
            columns: ["cycle_count_id"]
            isOneToOne: false
            referencedRelation: "cycle_counts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cycle_count_lines_equipment_item_id_fkey"
            columns: ["equipment_item_id"]
            isOneToOne: false
            referencedRelation: "equipment_items"
            referencedColumns: ["id"]
          },
        ]
      }
      cycle_counts: {
        Row: {
          created_at: string
          created_by_user_id: string
          id: string
          location_name: string
          ops_area: string
          rejection_note: string | null
          status: Database["public"]["Enums"]["cycle_count_status"]
          updated_at: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by_user_id: string
          id?: string
          location_name: string
          ops_area: string
          rejection_note?: string | null
          status?: Database["public"]["Enums"]["cycle_count_status"]
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by_user_id?: string
          id?: string
          location_name?: string
          ops_area?: string
          rejection_note?: string | null
          status?: Database["public"]["Enums"]["cycle_count_status"]
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
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
      fleet_audit_log: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          new_values: Json | null
          notes: string | null
          old_values: Json | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          new_values?: Json | null
          notes?: string | null
          old_values?: Json | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          new_values?: Json | null
          notes?: string | null
          old_values?: Json | null
        }
        Relationships: []
      }
      fleet_drivers: {
        Row: {
          country: string | null
          created_at: string
          email: string | null
          employment_type: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          phone: string | null
          region: string | null
          updated_at: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          email?: string | null
          employment_type?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          region?: string | null
          updated_at?: string
        }
        Update: {
          country?: string | null
          created_at?: string
          email?: string | null
          employment_type?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          region?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      fleet_notice_files: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_type: string
          id: string
          is_primary: boolean | null
          notice_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_type: string
          id?: string
          is_primary?: boolean | null
          notice_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_type?: string
          id?: string
          is_primary?: boolean | null
          notice_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fleet_notice_files_notice_id_fkey"
            columns: ["notice_id"]
            isOneToOne: false
            referencedRelation: "fleet_notices"
            referencedColumns: ["id"]
          },
        ]
      }
      fleet_notices: {
        Row: {
          confidence_overall: number | null
          country: string | null
          created_at: string
          created_by: string | null
          currency: string | null
          deadline_date: string | null
          dispute_date: string | null
          dispute_notes: string | null
          dispute_reason: string | null
          document_source: string | null
          driver_id: string | null
          field_confidence_map: Json | null
          fine_amount: number | null
          id: string
          issuing_authority: string | null
          language_detected: string | null
          license_plate: string | null
          notes_internal: string | null
          notice_type: Database["public"]["Enums"]["fleet_notice_type"]
          paid_amount: number | null
          paid_date: string | null
          payment_method: string | null
          raw_extracted_text: string | null
          received_date: string
          reference_number: string | null
          status: Database["public"]["Enums"]["fleet_notice_status"]
          tags: string[] | null
          unit_or_trip_id: string | null
          updated_at: string
          vehicle_id: string | null
          violation_datetime: string | null
          violation_location: string | null
        }
        Insert: {
          confidence_overall?: number | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          deadline_date?: string | null
          dispute_date?: string | null
          dispute_notes?: string | null
          dispute_reason?: string | null
          document_source?: string | null
          driver_id?: string | null
          field_confidence_map?: Json | null
          fine_amount?: number | null
          id?: string
          issuing_authority?: string | null
          language_detected?: string | null
          license_plate?: string | null
          notes_internal?: string | null
          notice_type?: Database["public"]["Enums"]["fleet_notice_type"]
          paid_amount?: number | null
          paid_date?: string | null
          payment_method?: string | null
          raw_extracted_text?: string | null
          received_date?: string
          reference_number?: string | null
          status?: Database["public"]["Enums"]["fleet_notice_status"]
          tags?: string[] | null
          unit_or_trip_id?: string | null
          updated_at?: string
          vehicle_id?: string | null
          violation_datetime?: string | null
          violation_location?: string | null
        }
        Update: {
          confidence_overall?: number | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          deadline_date?: string | null
          dispute_date?: string | null
          dispute_notes?: string | null
          dispute_reason?: string | null
          document_source?: string | null
          driver_id?: string | null
          field_confidence_map?: Json | null
          fine_amount?: number | null
          id?: string
          issuing_authority?: string | null
          language_detected?: string | null
          license_plate?: string | null
          notes_internal?: string | null
          notice_type?: Database["public"]["Enums"]["fleet_notice_type"]
          paid_amount?: number | null
          paid_date?: string | null
          payment_method?: string | null
          raw_extracted_text?: string | null
          received_date?: string
          reference_number?: string | null
          status?: Database["public"]["Enums"]["fleet_notice_status"]
          tags?: string[] | null
          unit_or_trip_id?: string | null
          updated_at?: string
          vehicle_id?: string | null
          violation_datetime?: string | null
          violation_location?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fleet_notices_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "fleet_drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fleet_notices_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "fleet_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      fleet_settings: {
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
      fleet_vehicle_assignments: {
        Row: {
          created_at: string
          created_by: string | null
          driver_id: string
          end_datetime: string | null
          id: string
          source: string | null
          start_datetime: string
          unit_or_trip_id: string | null
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          driver_id: string
          end_datetime?: string | null
          id?: string
          source?: string | null
          start_datetime: string
          unit_or_trip_id?: string | null
          vehicle_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          driver_id?: string
          end_datetime?: string | null
          id?: string
          source?: string | null
          start_datetime?: string
          unit_or_trip_id?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fleet_vehicle_assignments_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "fleet_drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fleet_vehicle_assignments_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "fleet_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      fleet_vehicles: {
        Row: {
          country_base: string | null
          created_at: string
          fleet_type: string
          id: string
          is_active: boolean
          license_plate: string
          make: string | null
          model: string | null
          notes: string | null
          updated_at: string
          vendor: string | null
          vin: string | null
          year: number | null
        }
        Insert: {
          country_base?: string | null
          created_at?: string
          fleet_type?: string
          id?: string
          is_active?: boolean
          license_plate: string
          make?: string | null
          model?: string | null
          notes?: string | null
          updated_at?: string
          vendor?: string | null
          vin?: string | null
          year?: number | null
        }
        Update: {
          country_base?: string | null
          created_at?: string
          fleet_type?: string
          id?: string
          is_active?: boolean
          license_plate?: string
          make?: string | null
          model?: string | null
          notes?: string | null
          updated_at?: string
          vendor?: string | null
          vin?: string | null
          year?: number | null
        }
        Relationships: []
      }
      guest_reservations: {
        Row: {
          bike_size: string | null
          created_at: string
          guest_name: string
          id: string
          notes: string | null
          reservation_code: string | null
          trip_id: string
          updated_at: string
        }
        Insert: {
          bike_size?: string | null
          created_at?: string
          guest_name: string
          id?: string
          notes?: string | null
          reservation_code?: string | null
          trip_id: string
          updated_at?: string
        }
        Update: {
          bike_size?: string | null
          created_at?: string
          guest_name?: string
          id?: string
          notes?: string | null
          reservation_code?: string | null
          trip_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_reservations_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
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
      incident_review_comments: {
        Row: {
          comment: string
          created_at: string
          id: string
          incident_id: string
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          incident_id: string
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          incident_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_review_comments_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "van_incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_move_lines: {
        Row: {
          created_at: string
          equipment_item_id: string | null
          id: string
          move_id: string
          notes: string | null
          qty: number
          sku: string
        }
        Insert: {
          created_at?: string
          equipment_item_id?: string | null
          id?: string
          move_id: string
          notes?: string | null
          qty: number
          sku: string
        }
        Update: {
          created_at?: string
          equipment_item_id?: string | null
          id?: string
          move_id?: string
          notes?: string | null
          qty?: number
          sku?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_move_lines_equipment_item_id_fkey"
            columns: ["equipment_item_id"]
            isOneToOne: false
            referencedRelation: "equipment_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_move_lines_move_id_fkey"
            columns: ["move_id"]
            isOneToOne: false
            referencedRelation: "inventory_moves"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_moves: {
        Row: {
          cancelled_at: string | null
          completed_at: string | null
          created_at: string
          created_by_user_id: string
          id: string
          notes: string | null
          source_location_name: string
          source_ops_area: string
          status: string
          target_location_name: string
          target_ops_area: string
          updated_at: string
        }
        Insert: {
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          created_by_user_id: string
          id?: string
          notes?: string | null
          source_location_name: string
          source_ops_area: string
          status?: string
          target_location_name: string
          target_ops_area: string
          updated_at?: string
        }
        Update: {
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          created_by_user_id?: string
          id?: string
          notes?: string | null
          source_location_name?: string
          source_ops_area?: string
          status?: string
          target_location_name?: string
          target_ops_area?: string
          updated_at?: string
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
      maintenance_records: {
        Row: {
          broken_item_report_id: string | null
          completed_at: string | null
          created_at: string
          created_by_user_id: string
          equipment_item_id: string | null
          id: string
          maintenance_type: string
          notes: string | null
          photo_path: string | null
          sku: string
          status: Database["public"]["Enums"]["maintenance_status"]
          updated_at: string
        }
        Insert: {
          broken_item_report_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by_user_id: string
          equipment_item_id?: string | null
          id?: string
          maintenance_type: string
          notes?: string | null
          photo_path?: string | null
          sku: string
          status?: Database["public"]["Enums"]["maintenance_status"]
          updated_at?: string
        }
        Update: {
          broken_item_report_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by_user_id?: string
          equipment_item_id?: string | null
          id?: string
          maintenance_type?: string
          notes?: string | null
          photo_path?: string | null
          sku?: string
          status?: Database["public"]["Enums"]["maintenance_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_records_broken_item_report_id_fkey"
            columns: ["broken_item_report_id"]
            isOneToOne: false
            referencedRelation: "broken_item_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_records_equipment_item_id_fkey"
            columns: ["equipment_item_id"]
            isOneToOne: false
            referencedRelation: "equipment_items"
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
      trips: {
        Row: {
          created_at: string
          end_date: string
          id: string
          ops_area: string | null
          start_date: string
          trip_code: string
          trip_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          ops_area?: string | null
          start_date: string
          trip_code: string
          trip_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          ops_area?: string | null
          start_date?: string
          trip_code?: string
          trip_name?: string
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
          ai_analysis_notes: string | null
          ai_confidence: string | null
          ai_cost_bucket: string | null
          ai_damaged_components: string[] | null
          ai_severity: string | null
          created_at: string
          created_by_user_id: string
          description: string
          driver_incident_count_this_season: number | null
          email_sent_at: string | null
          final_email_content: Json | null
          fs_communication_status: string | null
          id: string
          incident_date: string
          incident_time: string
          internal_notes: string | null
          ld_communication_status: string | null
          ld_cost_bucket_override: string | null
          ld_draft_content: Json | null
          ld_draft_generated_at: string | null
          ld_draft_status: string | null
          ld_edited_draft: Json | null
          ld_email_sent_at: string | null
          ld_preventability_decision: string | null
          ld_review_comment: string | null
          ld_review_status: string | null
          ld_reviewed_at: string | null
          ld_reviewed_by: string | null
          license_plate: string
          location_text: string
          ops_admin_user_id: string | null
          ops_area: string
          ops_email_sent_at: string | null
          ops_email_sent_by: string | null
          status: Database["public"]["Enums"]["incident_status"]
          trip_id: string | null
          updated_at: string
          van_id: string
          vehicle_drivable: boolean | null
          vin: string
          was_towed: boolean | null
          weather: string
        }
        Insert: {
          ai_analysis_notes?: string | null
          ai_confidence?: string | null
          ai_cost_bucket?: string | null
          ai_damaged_components?: string[] | null
          ai_severity?: string | null
          created_at?: string
          created_by_user_id: string
          description: string
          driver_incident_count_this_season?: number | null
          email_sent_at?: string | null
          final_email_content?: Json | null
          fs_communication_status?: string | null
          id?: string
          incident_date: string
          incident_time: string
          internal_notes?: string | null
          ld_communication_status?: string | null
          ld_cost_bucket_override?: string | null
          ld_draft_content?: Json | null
          ld_draft_generated_at?: string | null
          ld_draft_status?: string | null
          ld_edited_draft?: Json | null
          ld_email_sent_at?: string | null
          ld_preventability_decision?: string | null
          ld_review_comment?: string | null
          ld_review_status?: string | null
          ld_reviewed_at?: string | null
          ld_reviewed_by?: string | null
          license_plate: string
          location_text: string
          ops_admin_user_id?: string | null
          ops_area: string
          ops_email_sent_at?: string | null
          ops_email_sent_by?: string | null
          status?: Database["public"]["Enums"]["incident_status"]
          trip_id?: string | null
          updated_at?: string
          van_id: string
          vehicle_drivable?: boolean | null
          vin: string
          was_towed?: boolean | null
          weather: string
        }
        Update: {
          ai_analysis_notes?: string | null
          ai_confidence?: string | null
          ai_cost_bucket?: string | null
          ai_damaged_components?: string[] | null
          ai_severity?: string | null
          created_at?: string
          created_by_user_id?: string
          description?: string
          driver_incident_count_this_season?: number | null
          email_sent_at?: string | null
          final_email_content?: Json | null
          fs_communication_status?: string | null
          id?: string
          incident_date?: string
          incident_time?: string
          internal_notes?: string | null
          ld_communication_status?: string | null
          ld_cost_bucket_override?: string | null
          ld_draft_content?: Json | null
          ld_draft_generated_at?: string | null
          ld_draft_status?: string | null
          ld_edited_draft?: Json | null
          ld_email_sent_at?: string | null
          ld_preventability_decision?: string | null
          ld_review_comment?: string | null
          ld_review_status?: string | null
          ld_reviewed_at?: string | null
          ld_reviewed_by?: string | null
          license_plate?: string
          location_text?: string
          ops_admin_user_id?: string | null
          ops_area?: string
          ops_email_sent_at?: string | null
          ops_email_sent_by?: string | null
          status?: Database["public"]["Enums"]["incident_status"]
          trip_id?: string | null
          updated_at?: string
          van_id?: string
          vehicle_drivable?: boolean | null
          vin?: string
          was_towed?: boolean | null
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
            foreignKeyName: "van_incidents_ld_reviewed_by_fkey"
            columns: ["ld_reviewed_by"]
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
          {
            foreignKeyName: "van_incidents_ops_email_sent_by_fkey"
            columns: ["ops_email_sent_by"]
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
        | "tps"
      broken_item_severity: "low" | "medium" | "high"
      broken_item_status: "open" | "in_maintenance" | "resolved"
      cycle_count_status: "submitted" | "validated" | "rejected"
      fleet_notice_status:
        | "new"
        | "needs_review"
        | "ready_to_assign"
        | "assigned"
        | "in_payment"
        | "paid"
        | "in_dispute"
        | "closed"
        | "exception"
      fleet_notice_type:
        | "speeding"
        | "parking"
        | "restricted_zone"
        | "toll_fine"
        | "unknown"
      incident_status: "submitted" | "in_review" | "closed"
      maintenance_status: "open" | "completed"
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
        "tps",
      ],
      broken_item_severity: ["low", "medium", "high"],
      broken_item_status: ["open", "in_maintenance", "resolved"],
      cycle_count_status: ["submitted", "validated", "rejected"],
      fleet_notice_status: [
        "new",
        "needs_review",
        "ready_to_assign",
        "assigned",
        "in_payment",
        "paid",
        "in_dispute",
        "closed",
        "exception",
      ],
      fleet_notice_type: [
        "speeding",
        "parking",
        "restricted_zone",
        "toll_fine",
        "unknown",
      ],
      incident_status: ["submitted", "in_review", "closed"],
      maintenance_status: ["open", "completed"],
    },
  },
} as const
