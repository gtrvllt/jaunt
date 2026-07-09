export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      achievement: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      event: {
        Row: {
          created_at: string
          id: string
          name: string
          profile_id: string | null
          properties: Json
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          profile_id?: string | null
          properties?: Json
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          profile_id?: string | null
          properties?: Json
        }
        Relationships: [
          {
            foreignKeyName: "event_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      interest: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      jaunt: {
        Row: {
          completed_at: string | null
          created_at: string
          current_quest_index: number
          id: string
          scheduled_at: string | null
          status: Database["public"]["Enums"]["jaunt_status"]
          theme_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_quest_index?: number
          id?: string
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["jaunt_status"]
          theme_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_quest_index?: number
          id?: string
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["jaunt_status"]
          theme_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jaunt_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "jaunt_theme"
            referencedColumns: ["id"]
          },
        ]
      }
      jaunt_theme: {
        Row: {
          created_at: string
          description: string | null
          difficulty: number
          id: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          difficulty: number
          id?: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          difficulty?: number
          id?: string
          title?: string
        }
        Relationships: []
      }
      participation: {
        Row: {
          arrived_at: string | null
          current_quest_index: number
          id: string
          jaunt_id: string
          joined_at: string
          profile_id: string
          status: Database["public"]["Enums"]["participation_status"]
        }
        Insert: {
          arrived_at?: string | null
          current_quest_index?: number
          id?: string
          jaunt_id: string
          joined_at?: string
          profile_id: string
          status?: Database["public"]["Enums"]["participation_status"]
        }
        Update: {
          arrived_at?: string | null
          current_quest_index?: number
          id?: string
          jaunt_id?: string
          joined_at?: string
          profile_id?: string
          status?: Database["public"]["Enums"]["participation_status"]
        }
        Relationships: [
          {
            foreignKeyName: "participation_jaunt_id_fkey"
            columns: ["jaunt_id"]
            isOneToOne: false
            referencedRelation: "jaunt"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participation_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      profile: {
        Row: {
          avatar_url: string | null
          id: string
          joined_at: string
          nickname: string
          status: Database["public"]["Enums"]["profile_status"]
          xp_points: number
        }
        Insert: {
          avatar_url?: string | null
          id: string
          joined_at?: string
          nickname: string
          status?: Database["public"]["Enums"]["profile_status"]
          xp_points?: number
        }
        Update: {
          avatar_url?: string | null
          id?: string
          joined_at?: string
          nickname?: string
          status?: Database["public"]["Enums"]["profile_status"]
          xp_points?: number
        }
        Relationships: []
      }
      profile_achievement: {
        Row: {
          achievement_id: string
          earned_at: string
          id: string
          profile_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string
          id?: string
          profile_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_achievement_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievement"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_achievement_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_interest: {
        Row: {
          id: string
          interest_id: string
          profile_id: string
        }
        Insert: {
          id?: string
          interest_id: string
          profile_id: string
        }
        Update: {
          id?: string
          interest_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_interest_interest_id_fkey"
            columns: ["interest_id"]
            isOneToOne: false
            referencedRelation: "interest"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_interest_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      quest: {
        Row: {
          created_at: string
          hint_text: string
          hint_visual_url: string | null
          id: string
          location: unknown
          sequence_order: number
          theme_id: string
        }
        Insert: {
          created_at?: string
          hint_text: string
          hint_visual_url?: string | null
          id?: string
          location: unknown
          sequence_order: number
          theme_id: string
        }
        Update: {
          created_at?: string
          hint_text?: string
          hint_visual_url?: string | null
          id?: string
          location?: unknown
          sequence_order?: number
          theme_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quest_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "jaunt_theme"
            referencedColumns: ["id"]
          },
        ]
      }
      review: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          is_reported: boolean
          jaunt_id: string
          rating: number
          reviewee_id: string
          reviewer_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          is_reported?: boolean
          jaunt_id: string
          rating: number
          reviewee_id: string
          reviewer_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          is_reported?: boolean
          jaunt_id?: string
          rating?: number
          reviewee_id?: string
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_jaunt_id_fkey"
            columns: ["jaunt_id"]
            isOneToOne: false
            referencedRelation: "jaunt"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_reviewee_id_fkey"
            columns: ["reviewee_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      jaunt_status: "pending" | "active" | "completed" | "dropped"
      participation_status: "waiting" | "active" | "completed" | "dropped"
      profile_status: "idle" | "busy"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"]

export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T]

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"]

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"]

export const Constants = {
  public: {
    Enums: {
      jaunt_status: ["pending", "active", "completed", "dropped"],
      participation_status: ["waiting", "active", "completed", "dropped"],
      profile_status: ["idle", "busy"],
    },
  },
} as const
