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
      chat_messages: {
        Row: {
          id: string
          project_id: string
          role: string
          content: string
          model: string | null
          file_context: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          role: string
          content: string
          model?: string | null
          file_context?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          role?: string
          content?: string
          model?: string | null
          file_context?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      document_chunks: {
        Row: {
          content: string
          created_at: string | null
          embedding: string | null
          file_id: string
          id: string
          metadata: Json | null
        }
        Insert: {
          content: string
          created_at?: string | null
          embedding?: string | null
          file_id: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          content?: string
          created_at?: string | null
          embedding?: string | null
          file_id?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "document_chunks_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
        ]
      }
      exhibit_markers: {
        Row: {
          created_at: string | null
          description: string | null
          exhibit_id: string
          file_id: string | null
          id: string
          project_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          exhibit_id: string
          file_id?: string | null
          id?: string
          project_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          exhibit_id?: string
          file_id?: string | null
          id?: string
          project_id?: string
        }
        Relationships: []
      }
      files: {
        Row: {
          added_at: string | null
          added_by: string | null
          content: string | null
          file_path: string
          file_type: string | null
          id: string
          is_deleted: boolean | null
          last_modified: string | null
          name: string
          project_id: string
        }
        Insert: {
          added_at?: string | null
          added_by?: string | null
          content?: string | null
          file_path: string
          file_type?: string | null
          id?: string
          is_deleted?: boolean | null
          last_modified?: string | null
          name: string
          project_id: string
        }
        Update: {
          added_at?: string | null
          added_by?: string | null
          content?: string | null
          file_path?: string
          file_type?: string | null
          id?: string
          is_deleted?: boolean | null
          last_modified?: string | null
          name?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_knowledge_chunks: {
        Row: {
          chunk_index: number
          content: string
          created_at: string | null
          embedding: string | null
          fts: unknown
          id: string
          metadata: Json | null
          source_id: string
          source_type: string
          topics: string[] | null
        }
        Insert: {
          chunk_index?: number
          content: string
          created_at?: string | null
          embedding?: string | null
          fts?: unknown
          id?: string
          metadata?: Json | null
          source_id: string
          source_type: string
          topics?: string[] | null
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string | null
          embedding?: string | null
          fts?: unknown
          id?: string
          metadata?: Json | null
          source_id?: string
          source_type?: string
          topics?: string[] | null
        }
        Relationships: []
      }
      notes: {
        Row: {
          content: string | null
          created_at: string | null
          created_by: string | null
          id: string
          last_modified: string | null
          project_id: string
          title: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          last_modified?: string | null
          project_id: string
          title?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          last_modified?: string | null
          project_id?: string
          title?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          first_name: string | null
          id: string
          last_name: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string | null
          description: string | null
          goal_type: string | null
          id: string
          name: string
          owner_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          goal_type?: string | null
          id?: string
          name: string
          owner_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          goal_type?: string | null
          id?: string
          name?: string
          owner_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      projects_users: {
        Row: {
          created_at: string | null
          id: string
          project_id: string | null
          role: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_id?: string | null
          role?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          project_id?: string | null
          role?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_legal_knowledge: {
        Args: {
          filter_source_type?: string
          filter_topics?: string[]
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          metadata: Json
          similarity: number
          source_id: string
          source_type: string
          topics: string[]
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
