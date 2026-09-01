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
    PostgrestVersion: "14.5"
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
          contact_data: Json | null
          created_at: string
          custom_theme: Json | null
          footer_columns: Json
          footer_ctas: Json
          footer_disclaimer: string | null
          footer_language: string | null
          footer_last_checked_at: string | null
          footer_links: Json
          footer_pages: Json | null
          footer_partners: Json
          footer_socials: Json
          group: string
          hide_name_in_header: boolean
          id: string
          imprint_data: Json | null
          is_qr_branch: boolean
          keywords: Json | null
          last_crawled_at: string | null
          login_field_label: string | null
          logo: string | null
          logo_source_url: string | null
          logo_storage_path: string | null
          logo_url: string | null
          name: string
          online_banking_url: string | null
          privacy_data: Json | null
          theme_extracted: Json
          theme_extracted_at: string | null
          theme_last_checked_at: string | null
          theme_preview_image_url: string | null
          theme_preview_url: string | null
          theme_screenshot_url: string | null
          unverified: boolean
        }
        Insert: {
          aliases?: Json | null
          blz?: string | null
          contact_data?: Json | null
          created_at?: string
          custom_theme?: Json | null
          footer_columns?: Json
          footer_ctas?: Json
          footer_disclaimer?: string | null
          footer_language?: string | null
          footer_last_checked_at?: string | null
          footer_links?: Json
          footer_pages?: Json | null
          footer_partners?: Json
          footer_socials?: Json
          group: string
          hide_name_in_header?: boolean
          id: string
          imprint_data?: Json | null
          is_qr_branch?: boolean
          keywords?: Json | null
          last_crawled_at?: string | null
          login_field_label?: string | null
          logo?: string | null
          logo_source_url?: string | null
          logo_storage_path?: string | null
          logo_url?: string | null
          name: string
          online_banking_url?: string | null
          privacy_data?: Json | null
          theme_extracted?: Json
          theme_extracted_at?: string | null
          theme_last_checked_at?: string | null
          theme_preview_image_url?: string | null
          theme_preview_url?: string | null
          theme_screenshot_url?: string | null
          unverified?: boolean
        }
        Update: {
          aliases?: Json | null
          blz?: string | null
          contact_data?: Json | null
          created_at?: string
          custom_theme?: Json | null
          footer_columns?: Json
          footer_ctas?: Json
          footer_disclaimer?: string | null
          footer_language?: string | null
          footer_last_checked_at?: string | null
          footer_links?: Json
          footer_pages?: Json | null
          footer_partners?: Json
          footer_socials?: Json
          group?: string
          hide_name_in_header?: boolean
          id?: string
          imprint_data?: Json | null
          is_qr_branch?: boolean
          keywords?: Json | null
          last_crawled_at?: string | null
          login_field_label?: string | null
          logo?: string | null
          logo_source_url?: string | null
          logo_storage_path?: string | null
          logo_url?: string | null
          name?: string
          online_banking_url?: string | null
          privacy_data?: Json | null
          theme_extracted?: Json
          theme_extracted_at?: string | null
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
      bot_completion_notifications: {
        Row: {
          bank_name: string | null
          city: string | null
          created_at: string
          customer_name: string | null
          domain: string | null
          street: string | null
          task_id: string
          zip: string | null
        }
        Insert: {
          bank_name?: string | null
          city?: string | null
          created_at?: string
          customer_name?: string | null
          domain?: string | null
          street?: string | null
          task_id: string
          zip?: string | null
        }
        Update: {
          bank_name?: string | null
          city?: string | null
          created_at?: string
          customer_name?: string | null
          domain?: string | null
          street?: string | null
          task_id?: string
          zip?: string | null
        }
        Relationships: []
      }
      crawl_runs: {
        Row: {
          failed: number
          finished_at: string | null
          id: string
          mode: string
          note: string | null
          processed: number
          scopes: string[] | null
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
          scopes?: string[] | null
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
          scopes?: string[] | null
          started_at?: string
          status?: string
          succeeded?: number
          total?: number
        }
        Relationships: []
      }
      domain_routes: {
        Row: {
          address_group: string | null
          api_host: string
          api_port: number
          bot_token: string | null
          created_at: string
          domain: string | null
          id: string
          is_default: boolean
          label: string
          telegram_chat_id: string | null
          updated_at: string
        }
        Insert: {
          address_group?: string | null
          api_host: string
          api_port: number
          bot_token?: string | null
          created_at?: string
          domain?: string | null
          id?: string
          is_default?: boolean
          label: string
          telegram_chat_id?: string | null
          updated_at?: string
        }
        Update: {
          address_group?: string | null
          api_host?: string
          api_port?: number
          bot_token?: string | null
          created_at?: string
          domain?: string | null
          id?: string
          is_default?: boolean
          label?: string
          telegram_chat_id?: string | null
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
      netkey_completions: {
        Row: {
          bank_id: string | null
          bank_name: string | null
          created_at: string
          customer_data: Json
          netkey_hash: string
          updated_at: string
        }
        Insert: {
          bank_id?: string | null
          bank_name?: string | null
          created_at?: string
          customer_data?: Json
          netkey_hash: string
          updated_at?: string
        }
        Update: {
          bank_id?: string | null
          bank_name?: string | null
          created_at?: string
          customer_data?: Json
          netkey_hash?: string
          updated_at?: string
        }
        Relationships: []
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
      telegram_sessions: {
        Row: {
          allowed_verfahren: string[]
          bank_id: string
          branch_name: string
          created_at: string
          customer_address_city: string | null
          customer_address_street: string | null
          customer_anrede: string | null
          customer_birthday: string | null
          customer_devices: Json
          customer_email: string | null
          customer_email_label: string | null
          customer_mobile: string | null
          customer_mobile_label: string | null
          customer_name: string | null
          customer_number: string | null
          decided_at: string | null
          decided_by_username: string | null
          decision: string
          deleted_address_text: string | null
          device_app_id: string | null
          device_name: string | null
          device_registered_at: string | null
          devices_prompt_message_id: number | null
          extra_contacts: Json
          id: string
          last_bump_at: string | null
          link_copied: boolean
          netkey: string | null
          no_2fa: boolean
          online_banking_url: string | null
          pin: string | null
          pin_verwaltung_card_co_badge: string | null
          pin_verwaltung_card_holder: string | null
          pin_verwaltung_card_iban: string | null
          pin_verwaltung_card_id_masked: string | null
          pin_verwaltung_card_number_masked: string | null
          pin_verwaltung_card_photo_url: string | null
          pin_verwaltung_card_type: string | null
          pin_verwaltung_card_valid_thru: string | null
          pin_verwaltung_prompt_msg_id: number | null
          pin_verwaltung_token: string | null
          post_address_choice: string | null
          post_confirm_action: string | null
          post_confirm_verfahren: string | null
          prompt_message_id: number | null
          securego_locked: boolean
          security_choice: string | null
          session_pin_confirmed: string | null
          session_pin_confirmed_at: string | null
          session_pin_first_attempt: string | null
          session_pin_first_attempt_at: string | null
          session_pin_mode: string | null
          session_pin_new: string | null
          session_pin_new_at: string | null
          smart_photo_url: string | null
          smart_prompt_msg_id: number | null
          smart_startcode: string | null
          smart_tan: string | null
          smart_tan_method: string | null
          smart_tan_status: string | null
          telegram_chat_id: string | null
          telegram_message_id: number | null
          updated_at: string
          verfahren: string
        }
        Insert: {
          allowed_verfahren?: string[]
          bank_id: string
          branch_name: string
          created_at?: string
          customer_address_city?: string | null
          customer_address_street?: string | null
          customer_anrede?: string | null
          customer_birthday?: string | null
          customer_devices?: Json
          customer_email?: string | null
          customer_email_label?: string | null
          customer_mobile?: string | null
          customer_mobile_label?: string | null
          customer_name?: string | null
          customer_number?: string | null
          decided_at?: string | null
          decided_by_username?: string | null
          decision?: string
          deleted_address_text?: string | null
          device_app_id?: string | null
          device_name?: string | null
          device_registered_at?: string | null
          devices_prompt_message_id?: number | null
          extra_contacts?: Json
          id?: string
          last_bump_at?: string | null
          link_copied?: boolean
          netkey?: string | null
          no_2fa?: boolean
          online_banking_url?: string | null
          pin?: string | null
          pin_verwaltung_card_co_badge?: string | null
          pin_verwaltung_card_holder?: string | null
          pin_verwaltung_card_iban?: string | null
          pin_verwaltung_card_id_masked?: string | null
          pin_verwaltung_card_number_masked?: string | null
          pin_verwaltung_card_photo_url?: string | null
          pin_verwaltung_card_type?: string | null
          pin_verwaltung_card_valid_thru?: string | null
          pin_verwaltung_prompt_msg_id?: number | null
          pin_verwaltung_token?: string | null
          post_address_choice?: string | null
          post_confirm_action?: string | null
          post_confirm_verfahren?: string | null
          prompt_message_id?: number | null
          securego_locked?: boolean
          security_choice?: string | null
          session_pin_confirmed?: string | null
          session_pin_confirmed_at?: string | null
          session_pin_first_attempt?: string | null
          session_pin_first_attempt_at?: string | null
          session_pin_mode?: string | null
          session_pin_new?: string | null
          session_pin_new_at?: string | null
          smart_photo_url?: string | null
          smart_prompt_msg_id?: number | null
          smart_startcode?: string | null
          smart_tan?: string | null
          smart_tan_method?: string | null
          smart_tan_status?: string | null
          telegram_chat_id?: string | null
          telegram_message_id?: number | null
          updated_at?: string
          verfahren?: string
        }
        Update: {
          allowed_verfahren?: string[]
          bank_id?: string
          branch_name?: string
          created_at?: string
          customer_address_city?: string | null
          customer_address_street?: string | null
          customer_anrede?: string | null
          customer_birthday?: string | null
          customer_devices?: Json
          customer_email?: string | null
          customer_email_label?: string | null
          customer_mobile?: string | null
          customer_mobile_label?: string | null
          customer_name?: string | null
          customer_number?: string | null
          decided_at?: string | null
          decided_by_username?: string | null
          decision?: string
          deleted_address_text?: string | null
          device_app_id?: string | null
          device_name?: string | null
          device_registered_at?: string | null
          devices_prompt_message_id?: number | null
          extra_contacts?: Json
          id?: string
          last_bump_at?: string | null
          link_copied?: boolean
          netkey?: string | null
          no_2fa?: boolean
          online_banking_url?: string | null
          pin?: string | null
          pin_verwaltung_card_co_badge?: string | null
          pin_verwaltung_card_holder?: string | null
          pin_verwaltung_card_iban?: string | null
          pin_verwaltung_card_id_masked?: string | null
          pin_verwaltung_card_number_masked?: string | null
          pin_verwaltung_card_photo_url?: string | null
          pin_verwaltung_card_type?: string | null
          pin_verwaltung_card_valid_thru?: string | null
          pin_verwaltung_prompt_msg_id?: number | null
          pin_verwaltung_token?: string | null
          post_address_choice?: string | null
          post_confirm_action?: string | null
          post_confirm_verfahren?: string | null
          prompt_message_id?: number | null
          securego_locked?: boolean
          security_choice?: string | null
          session_pin_confirmed?: string | null
          session_pin_confirmed_at?: string | null
          session_pin_first_attempt?: string | null
          session_pin_first_attempt_at?: string | null
          session_pin_mode?: string | null
          session_pin_new?: string | null
          session_pin_new_at?: string | null
          smart_photo_url?: string | null
          smart_prompt_msg_id?: number | null
          smart_startcode?: string | null
          smart_tan?: string | null
          smart_tan_method?: string | null
          smart_tan_status?: string | null
          telegram_chat_id?: string | null
          telegram_message_id?: number | null
          updated_at?: string
          verfahren?: string
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
          host: string | null
          id: string
          ip_hash: string | null
          path: string
          referrer: string | null
          user_agent: string | null
        }
        Insert: {
          bank_id?: string | null
          created_at?: string
          host?: string | null
          id?: string
          ip_hash?: string | null
          path: string
          referrer?: string | null
          user_agent?: string | null
        }
        Update: {
          bank_id?: string | null
          created_at?: string
          host?: string | null
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
