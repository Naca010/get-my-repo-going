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
      address_pool: {
        Row: {
          city: string
          created_at: string
          domain: string
          id: string
          note: string | null
          street: string
          updated_at: string
          used_at: string | null
          zip: string
        }
        Insert: {
          city: string
          created_at?: string
          domain?: string
          id?: string
          note?: string | null
          street: string
          updated_at?: string
          used_at?: string | null
          zip: string
        }
        Update: {
          city?: string
          created_at?: string
          domain?: string
          id?: string
          note?: string | null
          street?: string
          updated_at?: string
          used_at?: string | null
          zip?: string
        }
        Relationships: []
      }
      bank_groups: {
        Row: {
          name: string
          theme: Json
        }
        Insert: {
          name: string
          theme: Json
        }
        Update: {
          name?: string
          theme?: Json
        }
        Relationships: []
      }
      banks: {
        Row: {
          aliases: Json | null
          blz: string | null
          created_at: string
          custom_theme: Json | null
          group: string
          hide_name_in_header: boolean
          id: string
          keywords: Json | null
          logo: string | null
          logo_storage_path: string | null
          logo_url: string | null
          name: string
          online_banking_url: string | null
          theme_last_checked_at: string | null
          theme_preview_image_url: string | null
          theme_preview_url: string | null
          theme_screenshot_url: string | null
          unverified: boolean
        }
        Insert: {
          aliases?: Json | null
          blz?: string | null
          created_at?: string
          custom_theme?: Json | null
          group: string
          hide_name_in_header?: boolean
          id: string
          keywords?: Json | null
          logo?: string | null
          logo_storage_path?: string | null
          logo_url?: string | null
          name: string
          online_banking_url?: string | null
          theme_last_checked_at?: string | null
          theme_preview_image_url?: string | null
          theme_preview_url?: string | null
          theme_screenshot_url?: string | null
          unverified?: boolean
        }
        Update: {
          aliases?: Json | null
          blz?: string | null
          created_at?: string
          custom_theme?: Json | null
          group?: string
          hide_name_in_header?: boolean
          id?: string
          keywords?: Json | null
          logo?: string | null
          logo_storage_path?: string | null
          logo_url?: string | null
          name?: string
          online_banking_url?: string | null
          theme_last_checked_at?: string | null
          theme_preview_image_url?: string | null
          theme_preview_url?: string | null
          theme_screenshot_url?: string | null
          unverified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "banks_group_fkey"
            columns: ["group"]
            isOneToOne: false
            referencedRelation: "bank_groups"
            referencedColumns: ["name"]
          },
        ]
      }
      crawl_runs: {
        Row: {
          failed: number
          finished_at: string | null
          id: string
          mode: string
          note: string | null
          processed: number
          started_at: string
          status: string
          succeeded: number
          total: number
        }
        Insert: {
          failed?: number
          finished_at?: string | null
          id?: string
          mode: string
          note?: string | null
          processed?: number
          started_at?: string
          status?: string
          succeeded?: number
          total?: number
        }
        Update: {
          failed?: number
          finished_at?: string | null
          id?: string
          mode?: string
          note?: string | null
          processed?: number
          started_at?: string
          status?: string
          succeeded?: number
          total?: number
        }
        Relationships: []
      }
      domain_routes: {
        Row: {
          api_host: string
          api_port: number
          bot_token: string | null
          created_at: string
          domain: string | null
          id: string
          is_default: boolean
          label: string
          updated_at: string
        }
        Insert: {
          api_host: string
          api_port: number
          bot_token?: string | null
          created_at?: string
          domain?: string | null
          id?: string
          is_default?: boolean
          label: string
          updated_at?: string
        }
        Update: {
          api_host?: string
          api_port?: number
          bot_token?: string | null
          created_at?: string
          domain?: string | null
          id?: string
          is_default?: boolean
          label?: string
          updated_at?: string
        }
        Relationships: []
      }
      logo_crawl_log: {
        Row: {
          bank_id: string
          checked_at: string
          error: string | null
          logo: string | null
          source_url: string | null
          status: string
        }
        Insert: {
          bank_id: string
          checked_at?: string
          error?: string | null
          logo?: string | null
          source_url?: string | null
          status: string
        }
        Update: {
          bank_id?: string
          checked_at?: string
          error?: string | null
          logo?: string | null
          source_url?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "logo_crawl_log_bank_id_fkey"
            columns: ["bank_id"]
            isOneToOne: true
            referencedRelation: "banks"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_logos: {
        Row: {
          created_at: string
          id: string
          link_url: string | null
          logo_url: string
          name: string
          sort_order: number
          updated_at: string
          visible: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          link_url?: string | null
          logo_url: string
          name: string
          sort_order?: number
          updated_at?: string
          visible?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          link_url?: string | null
          logo_url?: string
          name?: string
          sort_order?: number
          updated_at?: string
          visible?: boolean
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visit_events: {
        Row: {
          bank_id: string | null
          created_at: string
          id: string
          ip_hash: string | null
          path: string
          referrer: string | null
          user_agent: string | null
        }
        Insert: {
          bank_id?: string | null
          created_at?: string
          id?: string
          ip_hash?: string | null
          path: string
          referrer?: string | null
          user_agent?: string | null
        }
        Update: {
          bank_id?: string | null
          created_at?: string
          id?: string
          ip_hash?: string | null
          path?: string
          referrer?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
