export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      api_keys: {
        Row: {
          id: string
          user_id: string
          name: string
          key_prefix: string
          key_hash: string
          revoked: boolean
          created_at: string
          last_used_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          key_prefix: string
          key_hash: string
          revoked?: boolean
          created_at?: string
          last_used_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          key_prefix?: string
          key_hash?: string
          revoked?: boolean
          created_at?: string
          last_used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      get_my_invite_count: {
        Args: Record<string, never>
        Returns: number
      }
      get_my_auth_sessions: {
        Args: Record<string, never>
        Returns: {
          id: string
          created_at: string
          updated_at: string
          refreshed_at: string | null
          user_agent: string | null
          ip: string | null
        }[]
      }
      revoke_auth_session: {
        Args: { target_session_id: string }
        Returns: undefined
      }
      revoke_other_auth_sessions: {
        Args: { current_session_id: string }
        Returns: undefined
      }
      sync_my_auth_session_device: {
        Args: { target_session_id: string; session_user_agent: string }
        Returns: undefined
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type ApiKeyRow = Database["public"]["Tables"]["api_keys"]["Row"]
