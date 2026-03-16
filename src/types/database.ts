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
          sources: Json | null
          complexity: string | null
          effort_level: string | null
          follow_ups: Json | null
        }
        Insert: {
          id?: string
          project_id: string
          role: string
          content: string
          model?: string | null
          file_context?: string | null
          created_at?: string | null
          sources?: Json | null
          complexity?: string | null
          effort_level?: string | null
          follow_ups?: Json | null
        }
        Update: {
          id?: string
          project_id?: string
          role?: string
          content?: string
          model?: string | null
          file_context?: string | null
          created_at?: string | null
          sources?: Json | null
          complexity?: string | null
          effort_level?: string | null
          follow_ups?: Json | null
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
          chunk_type: string | null
          chunk_index: number | null
          parent_chunk_id: string | null
          page_number: number | null
          section_heading: string | null
          char_start: number | null
          char_end: number | null
          timestamp_start: number | null
          timestamp_end: number | null
          source_file_name: string | null
          source_file_type: string | null
          fts: unknown
        }
        Insert: {
          content: string
          created_at?: string | null
          embedding?: string | null
          file_id: string
          id?: string
          metadata?: Json | null
          chunk_type?: string | null
          chunk_index?: number | null
          parent_chunk_id?: string | null
          page_number?: number | null
          section_heading?: string | null
          char_start?: number | null
          char_end?: number | null
          timestamp_start?: number | null
          timestamp_end?: number | null
          source_file_name?: string | null
          source_file_type?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          embedding?: string | null
          file_id?: string
          id?: string
          metadata?: Json | null
          chunk_type?: string | null
          chunk_index?: number | null
          parent_chunk_id?: string | null
          page_number?: number | null
          section_heading?: string | null
          char_start?: number | null
          char_end?: number | null
          timestamp_start?: number | null
          timestamp_end?: number | null
          source_file_name?: string | null
          source_file_type?: string | null
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
          sort_order: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          exhibit_id: string
          file_id?: string | null
          id?: string
          project_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          exhibit_id?: string
          file_id?: string | null
          id?: string
          project_id?: string
          sort_order?: number
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
          processing_status: string | null
          processed_at: string | null
          ai_summary: string | null
          extracted_text: string | null
          chunk_count: number | null
          processing_error: string | null
          document_type: string | null
          classification_metadata: Json | null
          classification_confidence: number | null
          classification_source: string | null
          classified_at: string | null
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
          processing_status?: string | null
          processed_at?: string | null
          ai_summary?: string | null
          extracted_text?: string | null
          chunk_count?: number | null
          processing_error?: string | null
          document_type?: string | null
          classification_metadata?: Json | null
          classification_confidence?: number | null
          classification_source?: string | null
          classified_at?: string | null
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
          processing_status?: string | null
          processed_at?: string | null
          ai_summary?: string | null
          extracted_text?: string | null
          chunk_count?: number | null
          processing_error?: string | null
          document_type?: string | null
          classification_metadata?: Json | null
          classification_confidence?: number | null
          classification_source?: string | null
          classified_at?: string | null
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
      legal_cases: {
        Row: {
          id: string
          case_name: string
          citation: string
          neutral_citation: string | null
          court: string
          court_level: string
          decision_date: string
          jurisdiction: string
          judges: string[]
          summary: string | null
          ratio: string | null
          key_holdings: string[]
          facts_summary: string | null
          canli_url: string | null
          is_landmark: boolean
          created_at: string | null
        }
        Insert: {
          id?: string
          case_name: string
          citation: string
          neutral_citation?: string | null
          court: string
          court_level: string
          decision_date: string
          jurisdiction: string
          judges?: string[]
          summary?: string | null
          ratio?: string | null
          key_holdings?: string[]
          facts_summary?: string | null
          canli_url?: string | null
          is_landmark?: boolean
          created_at?: string | null
        }
        Update: {
          id?: string
          case_name?: string
          citation?: string
          neutral_citation?: string | null
          court?: string
          court_level?: string
          decision_date?: string
          jurisdiction?: string
          judges?: string[]
          summary?: string | null
          ratio?: string | null
          key_holdings?: string[]
          facts_summary?: string | null
          canli_url?: string | null
          is_landmark?: boolean
          created_at?: string | null
        }
        Relationships: []
      }
      legal_legislation: {
        Row: {
          id: string
          title: string
          short_title: string | null
          jurisdiction: string
          legislation_type: string
          citation: string
          url: string | null
          in_force: boolean
          summary: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          title: string
          short_title?: string | null
          jurisdiction: string
          legislation_type: string
          citation: string
          url?: string | null
          in_force?: boolean
          summary?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          short_title?: string | null
          jurisdiction?: string
          legislation_type?: string
          citation?: string
          url?: string | null
          in_force?: boolean
          summary?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      legal_legislation_sections: {
        Row: {
          id: string
          legislation_id: string
          section_number: string
          title: string | null
          content: string
          summary: string | null
          keywords: string[]
          created_at: string | null
        }
        Insert: {
          id?: string
          legislation_id: string
          section_number: string
          title?: string | null
          content: string
          summary?: string | null
          keywords?: string[]
          created_at?: string | null
        }
        Update: {
          id?: string
          legislation_id?: string
          section_number?: string
          title?: string | null
          content?: string
          summary?: string | null
          keywords?: string[]
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "legal_legislation_sections_legislation_id_fkey"
            columns: ["legislation_id"]
            isOneToOne: false
            referencedRelation: "legal_legislation"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_principles: {
        Row: {
          id: string
          name: string
          category: string
          description: string
          elements: string[]
          source_case_id: string | null
          source_legislation_id: string | null
          current_status: string
          notes: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          category: string
          description: string
          elements?: string[]
          source_case_id?: string | null
          source_legislation_id?: string | null
          current_status?: string
          notes?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          category?: string
          description?: string
          elements?: string[]
          source_case_id?: string | null
          source_legislation_id?: string | null
          current_status?: string
          notes?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      legal_topics: {
        Row: {
          id: string
          name: string
          slug: string
          parent_id: string | null
          description: string | null
          display_order: number
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          parent_id?: string | null
          description?: string | null
          display_order?: number
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          parent_id?: string | null
          description?: string | null
          display_order?: number
          created_at?: string | null
        }
        Relationships: []
      }
      timeline_events: {
        Row: {
          id: string
          project_id: string
          date: string
          title: string
          description: string | null
          category: string | null
          confidence: string | null
          source_file_id: string | null
          source_file_name: string | null
          source_page: number | null
          excerpt: string | null
          is_verified: boolean
          is_hidden: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          date: string
          title: string
          description?: string | null
          category?: string | null
          confidence?: string | null
          source_file_id?: string | null
          source_file_name?: string | null
          source_page?: number | null
          excerpt?: string | null
          is_verified?: boolean
          is_hidden?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          date?: string
          title?: string
          description?: string | null
          category?: string | null
          confidence?: string | null
          source_file_id?: string | null
          source_file_name?: string | null
          source_page?: number | null
          excerpt?: string | null
          is_verified?: boolean
          is_hidden?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timeline_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
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
      search_documents: {
        Args: {
          p_query_text: string
          p_query_embedding: string
          p_match_count?: number
          p_project_id?: string
          p_file_type?: string
        }
        Returns: {
          chunk_id: string
          file_id: string
          content: string
          page_number: number | null
          section_heading: string | null
          chunk_type: string
          source_file_name: string
          source_file_type: string
          timestamp_start: number | null
          rrf_score: number
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
