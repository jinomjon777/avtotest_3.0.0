// AVTOMATIK YARATILGAN: python3 scripts/gen-db-types.py (migratsiyalardan). Qo'lda o'zgartirmang.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "12"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          created_at: string
          id: number
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      chek: {
        Row: {
          amount: number | null
          chek_link: string | null
          created_at: string | null
          days: number | null
          email: string | null
          id: string
          premium_until: string | null
          processed: boolean
          reviewed_at: string | null
          source: string
          status: string
          tariff_days: number | null
          telegram_chat_id: number | null
          telegram_username: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          chek_link?: string | null
          created_at?: string | null
          days?: number | null
          email?: string | null
          id?: string
          premium_until?: string | null
          processed?: boolean
          reviewed_at?: string | null
          source?: string
          status?: string
          tariff_days?: number | null
          telegram_chat_id?: number | null
          telegram_username?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          chek_link?: string | null
          created_at?: string | null
          days?: number | null
          email?: string | null
          id?: string
          premium_until?: string | null
          processed?: boolean
          reviewed_at?: string | null
          source?: string
          status?: string
          tariff_days?: number | null
          telegram_chat_id?: number | null
          telegram_username?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          contact_method: string | null
          created_at: string
          id: string
          is_read: boolean
          message: string
          name: string
          phone: string | null
          subject: string
          telegram_username: string | null
          user_id: string | null
        }
        Insert: {
          contact_method?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          name: string
          phone?: string | null
          subject: string
          telegram_username?: string | null
          user_id?: string | null
        }
        Update: {
          contact_method?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          name?: string
          phone?: string | null
          subject?: string
          telegram_username?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      device_removals: {
        Row: {
          created_at: string
          device_id: string
          id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          device_id: string
          id?: number
          user_id: string
        }
        Update: {
          created_at?: string
          device_id?: string
          id?: number
          user_id?: string
        }
        Relationships: []
      }
      free_daily_usage: {
        Row: {
          day: string
          kind: string
          samples: number
          used_at: string
          user_id: string
        }
        Insert: {
          day: string
          kind: string
          samples?: number
          used_at?: string
          user_id: string
        }
        Update: {
          day?: string
          kind?: string
          samples?: number
          used_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          amount: number
          days: number
          id: string
          is_active: boolean
          label: string
          sort: number
          updated_at: string
        }
        Insert: {
          amount: number
          days: number
          id: string
          is_active?: boolean
          label: string
          sort?: number
          updated_at?: string
        }
        Update: {
          amount?: number
          days?: number
          id?: string
          is_active?: boolean
          label?: string
          sort?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          daily_goal: number
          email: string | null
          exam_date: string | null
          full_name: string | null
          id: string
          is_trial_used: boolean
          tariff_days: number
          tariff_end_date: string | null
          tariff_start_date: string | null
          trial_end_date: string | null
          trial_start_date: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          daily_goal?: number
          email?: string | null
          exam_date?: string | null
          full_name?: string | null
          id: string
          is_trial_used?: boolean
          tariff_days?: number
          tariff_end_date?: string | null
          tariff_start_date?: string | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          daily_goal?: number
          email?: string | null
          exam_date?: string | null
          full_name?: string | null
          id?: string
          is_trial_used?: boolean
          tariff_days?: number
          tariff_end_date?: string | null
          tariff_start_date?: string | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          action: string
          created_at: string | null
          id: string
          identifier: string
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          identifier: string
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          identifier?: string
        }
        Relationships: []
      }
      reminder_log: {
        Row: {
          day: string
          last_sent_at: string | null
          sent_count: number
          user_id: string
        }
        Insert: {
          day: string
          last_sent_at?: string | null
          sent_count?: number
          user_id: string
        }
        Update: {
          day?: string
          last_sent_at?: string | null
          sent_count?: number
          user_id?: string
        }
        Relationships: []
      }
      reminder_settings: {
        Row: {
          enabled: boolean
          push: boolean
          remind_time: string
          telegram: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          enabled?: boolean
          push?: boolean
          remind_time: string
          telegram?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          enabled?: boolean
          push?: boolean
          remind_time?: string
          telegram?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_questions: {
        Row: {
          created_at: string
          question_key: string
          user_id: string
        }
        Insert: {
          created_at?: string
          question_key: string
          user_id: string
        }
        Update: {
          created_at?: string
          question_key?: string
          user_id?: string
        }
        Relationships: []
      }
      served_questions: {
        Row: {
          question_key: string
          served_at: string
          user_id: string
        }
        Insert: {
          question_key: string
          served_at?: string
          user_id: string
        }
        Update: {
          question_key?: string
          served_at?: string
          user_id?: string
        }
        Relationships: []
      }
      telegram_bot_sessions: {
        Row: {
          chat_id: number
          email_attempts: number
          email_window: string | null
          first_name: string | null
          pending_chek_id: string | null
          plan_amount: number | null
          plan_days: number | null
          receipt_file_id: string | null
          receipt_url: string | null
          site_email: string | null
          step: string
          updated_at: string
          username: string | null
        }
        Insert: {
          chat_id: number
          email_attempts?: number
          email_window?: string | null
          first_name?: string | null
          pending_chek_id?: string | null
          plan_amount?: number | null
          plan_days?: number | null
          receipt_file_id?: string | null
          receipt_url?: string | null
          site_email?: string | null
          step?: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          chat_id?: number
          email_attempts?: number
          email_window?: string | null
          first_name?: string | null
          pending_chek_id?: string | null
          plan_amount?: number | null
          plan_days?: number | null
          receipt_file_id?: string | null
          receipt_url?: string | null
          site_email?: string | null
          step?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      telegram_link_tokens: {
        Row: {
          expires_at: string
          token: string
          user_id: string
        }
        Insert: {
          expires_at: string
          token: string
          user_id: string
        }
        Update: {
          expires_at?: string
          token?: string
          user_id?: string
        }
        Relationships: []
      }
      telegram_links: {
        Row: {
          chat_id: number
          linked_at: string
          user_id: string
        }
        Insert: {
          chat_id: number
          linked_at?: string
          user_id: string
        }
        Update: {
          chat_id?: number
          linked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      test_results: {
        Row: {
          access_type: string | null
          completed_at: string
          correct_answers: number
          created_at: string
          id: string
          is_premium: boolean
          question_source: string | null
          time_taken_seconds: number | null
          total_questions: number
          user_id: string
          variant: number
        }
        Insert: {
          access_type?: string | null
          completed_at?: string
          correct_answers?: number
          created_at?: string
          id?: string
          is_premium?: boolean
          question_source?: string | null
          time_taken_seconds?: number | null
          total_questions?: number
          user_id: string
          variant: number
        }
        Update: {
          access_type?: string | null
          completed_at?: string
          correct_answers?: number
          created_at?: string
          id?: string
          is_premium?: boolean
          question_source?: string | null
          time_taken_seconds?: number | null
          total_questions?: number
          user_id?: string
          variant?: number
        }
        Relationships: []
      }
      test_sessions: {
        Row: {
          access_type: string
          completed: boolean
          created_at: string
          expires_at: string
          id: string
          is_premium: boolean
          question_source: string
          started_at: string
          user_id: string | null
          variant: number
        }
        Insert: {
          access_type: string
          completed?: boolean
          created_at?: string
          expires_at: string
          id?: string
          is_premium?: boolean
          question_source: string
          started_at?: string
          user_id?: string | null
          variant?: number
        }
        Update: {
          access_type?: string
          completed?: boolean
          created_at?: string
          expires_at?: string
          id?: string
          is_premium?: boolean
          question_source?: string
          started_at?: string
          user_id?: string | null
          variant?: number
        }
        Relationships: []
      }
      user_answers: {
        Row: {
          answered_at: string
          id: number
          is_correct: boolean
          question_key: string
          result_id: string | null
          selected_option: number | null
          topic_id: string | null
          user_id: string
        }
        Insert: {
          answered_at?: string
          id?: number
          is_correct: boolean
          question_key: string
          result_id?: string | null
          selected_option?: number | null
          topic_id?: string | null
          user_id: string
        }
        Update: {
          answered_at?: string
          id?: number
          is_correct?: boolean
          question_key?: string
          result_id?: string | null
          selected_option?: number | null
          topic_id?: string | null
          user_id?: string
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
          role?: Database["public"]["Enums"]["app_role"]
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
      user_sessions: {
        Row: {
          created_at: string
          device_id: string
          device_info: string | null
          id: string
          last_seen: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_id: string
          device_info?: string | null
          id?: string
          last_seen?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_id?: string
          device_info?: string | null
          id?: string
          last_seen?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_free_session: {
        Args: {
          p_kind: string
        }
        Returns: Json
      }
      create_telegram_link_token: {
        Args: never
        Returns: Json
      }
      current_user_email: {
        Args: never
        Returns: string
      }
      delete_push_subscription: {
        Args: {
          p_endpoint: string
        }
        Returns: Json
      }
      get_admin_analytics: {
        Args: {
          p_days?: number
        }
        Returns: Json
      }
      get_daily_plan: {
        Args: never
        Returns: Json
      }
      get_dashboard_stats: {
        Args: never
        Returns: Json
      }
      get_my_mistakes: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_only_unresolved?: boolean
        }
        Returns: Json
      }
      get_recent_activity: {
        Args: {
          p_days?: number
        }
        Returns: Json
      }
      get_user_access_state: {
        Args: never
        Returns: Json
      }
      get_weak_topics: {
        Args: {
          p_days?: number
          p_min_answers?: number
        }
        Returns: Json
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      save_push_subscription: {
        Args: {
          p_endpoint: string
          p_p256dh: string
          p_auth: string
        }
        Returns: Json
      }
      set_reminder: {
        Args: {
          p_enabled: boolean
          p_time: string
          p_telegram: boolean
          p_push: boolean
        }
        Returns: Json
      }
      start_test_session: {
        Args: {
          p_variant: number
          p_question_source: string
          p_is_premium: boolean
        }
        Returns: Json
      }
      submit_test: {
        Args: {
          p_session_id: string
          p_variant: number
          p_correct: number
          p_total: number
          p_time_seconds: number
          p_answers?: Json
        }
        Returns: Json
      }
      toggle_saved_question: {
        Args: {
          p_key: string
        }
        Returns: Json
      }
      track_event: {
        Args: {
          p_name: string
        }
        Returns: Json
      }
      unlink_telegram: {
        Args: never
        Returns: Json
      }
      verify_and_save_test_result: {
        Args: {
          p_session_id: string
          p_variant: number
          p_correct_answers: number
          p_total_questions: number
          p_time_taken_seconds: number
        }
        Returns: Json
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
      message_sender: ["user", "admin"],
    },
  },
} as const