import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          auth_user_id: string | null;
          email: string;
          username: string;
          full_name: string | null;
          avatar_url: string | null;
          college: string | null;
          year: 'first' | 'second' | 'third' | 'fourth' | 'graduate' | null;
          bio: string | null;
          headline: string | null;
          location: string | null;
          website_url: string | null;
          github_url: string | null;
          linkedin_url: string | null;
          twitter_url: string | null;
          role: 'user' | 'admin' | 'moderator';
          account_status: 'active' | 'pending' | 'suspended' | 'deactivated';
          is_profile_public: boolean;
          hide_email: boolean;
          email_verified: boolean;
          auth_provider: 'email' | 'google' | 'github' | 'apple' | 'linkedin';
          last_login_at: string | null;
          registration_ip: string | null;
          registration_ua: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          auth_user_id?: string | null;
          email: string;
          username: string;
          full_name?: string | null;
          avatar_url?: string | null;
          college?: string | null;
          year?: 'first' | 'second' | 'third' | 'fourth' | 'graduate' | null;
          bio?: string | null;
          headline?: string | null;
          location?: string | null;
          website_url?: string | null;
          github_url?: string | null;
          linkedin_url?: string | null;
          twitter_url?: string | null;
          role?: 'user' | 'admin' | 'moderator';
          account_status?: 'active' | 'pending' | 'suspended' | 'deactivated';
          is_profile_public?: boolean;
          hide_email?: boolean;
          email_verified?: boolean;
          auth_provider?: 'email' | 'google' | 'github' | 'apple' | 'linkedin';
          last_login_at?: string | null;
          registration_ip?: string | null;
          registration_ua?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          auth_user_id?: string | null;
          email?: string;
          username?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          college?: string | null;
          year?: 'first' | 'second' | 'third' | 'fourth' | 'graduate' | null;
          bio?: string | null;
          headline?: string | null;
          location?: string | null;
          website_url?: string | null;
          github_url?: string | null;
          linkedin_url?: string | null;
          twitter_url?: string | null;
          role?: 'user' | 'admin' | 'moderator';
          account_status?: 'active' | 'pending' | 'suspended' | 'deactivated';
          is_profile_public?: boolean;
          hide_email?: boolean;
          email_verified?: boolean;
          auth_provider?: 'email' | 'google' | 'github' | 'apple' | 'linkedin';
          last_login_at?: string | null;
          registration_ip?: string | null;
          registration_ua?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      },
      proof_cards: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          source_type: 'github' | 'kaggle' | 'certificate' | 'hackathon' | 'project' | 'blog' | 'demo' | 'other';
          source_url: string | null;
          thumbnail_url: string | null;
          skills_extracted: string[];
          skills_user_added: string[];
          what_it_proves: string[];
          verification_status: 'draft' | 'pending' | 'verified' | 'rejected';
          visibility: 'private' | 'unlisted' | 'public';
          verified_at: string | null;
          view_count: number;
          is_highlighted: boolean;
          sort_order: number;
          metadata: Record<string, unknown>;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        },
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          source_type: 'github' | 'kaggle' | 'certificate' | 'hackathon' | 'project' | 'blog' | 'demo' | 'other';
          source_url?: string | null;
          thumbnail_url?: string | null;
          skills_extracted?: string[];
          skills_user_added?: string[];
          what_it_proves?: string[];
          verification_status?: 'draft' | 'pending' | 'verified' | 'rejected';
          visibility?: 'private' | 'unlisted' | 'public';
          verified_at?: string | null;
          view_count?: number;
          is_highlighted?: boolean;
          sort_order?: number;
          metadata?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        },
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          source_type?: 'github' | 'kaggle' | 'certificate' | 'hackathon' | 'project' | 'blog' | 'demo' | 'other';
          source_url?: string | null;
          thumbnail_url?: string | null;
          skills_extracted?: string[];
          skills_user_added?: string[];
          what_it_proves?: string[];
          verification_status?: 'draft' | 'pending' | 'verified' | 'rejected';
          visibility?: 'private' | 'unlisted' | 'public';
          verified_at?: string | null;
          view_count?: number;
          is_highlighted?: boolean;
          sort_order?: number;
          metadata?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        },
        Relationships: [
          {
            foreignKeyName: 'proof_cards_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      opportunities: {
        Row: {
          id: string;
          title: string;
          company: string;
          type: 'internship' | 'job' | 'scholarship' | 'mentorship' | 'hackathon' | 'research' | 'other';
          required_skills: string[];
          nice_to_have: string[];
          description: string | null;
          location: string | null;
          is_remote: boolean;
          link: string;
          apply_deadline: string | null;
          match_percentage: number;
          salary_min: number | null;
          salary_max: number | null;
          salary_currency: string | null;
          source: string | null;
          source_external_id: string | null;
          is_active: boolean;
          posted_at: string | null;
          metadata: Record<string, unknown>;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          company: string;
          type?: 'internship' | 'job' | 'scholarship' | 'mentorship' | 'hackathon' | 'research' | 'other';
          required_skills?: string[];
          nice_to_have?: string[];
          description?: string | null;
          location?: string | null;
          is_remote?: boolean;
          link: string;
          apply_deadline?: string | null;
          match_percentage?: number;
          salary_min?: number | null;
          salary_max?: number | null;
          salary_currency?: string | null;
          source?: string | null;
          source_external_id?: string | null;
          is_active?: boolean;
          posted_at?: string | null;
          metadata?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          company?: string;
          type?: 'internship' | 'job' | 'scholarship' | 'mentorship' | 'hackathon' | 'research' | 'other';
          required_skills?: string[];
          nice_to_have?: string[];
          description?: string | null;
          location?: string | null;
          is_remote?: boolean;
          link?: string;
          apply_deadline?: string | null;
          match_percentage?: number;
          salary_min?: number | null;
          salary_max?: number | null;
          salary_currency?: string | null;
          source?: string | null;
          source_external_id?: string | null;
          is_active?: boolean;
          posted_at?: string | null;
          metadata?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      },
      coach_notes: {
        Row: {
          id: string;
          user_id: string;
          type: 'daily' | 'weekly' | 'milestone' | 'ad_hoc';
          content: string;
          action_label: string | null;
          action_url: string | null;
          priority: number;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        },
        Insert: {
          id?: string;
          user_id: string;
          type?: 'daily' | 'weekly' | 'milestone' | 'ad_hoc';
          content: string;
          action_label?: string | null;
          action_url?: string | null;
          priority?: number;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        },
        Update: {
          id?: string;
          user_id?: string;
          type?: 'daily' | 'weekly' | 'milestone' | 'ad_hoc';
          content?: string;
          action_label?: string | null;
          action_url?: string | null;
          priority?: number;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        },
        Relationships: [
          {
            foreignKeyName: 'coach_notes_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      proof_sources: {
        Row: {
          id: string;
          user_id: string;
          source_type: 'github' | 'kaggle' | 'certificate' | 'hackathon' | 'project' | 'blog' | 'demo' | 'other';
          source_url: string | null;
          source_name: string | null;
          is_connected: boolean;
          last_synced_at: string | null;
          metadata: Record<string, unknown>;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          source_type: 'github' | 'kaggle' | 'certificate' | 'hackathon' | 'project' | 'blog' | 'demo' | 'other';
          source_url?: string | null;
          source_name?: string | null;
          is_connected?: boolean;
          last_synced_at?: string | null;
          metadata?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          source_type?: 'github' | 'kaggle' | 'certificate' | 'hackathon' | 'project' | 'blog' | 'demo' | 'other';
          source_url?: string | null;
          source_name?: string | null;
          is_connected?: boolean;
          last_synced_at?: string | null;
          metadata?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'proof_sources_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      proof_shares: {
        Row: {
          id: string;
          proof_id: string;
          owner_id: string;
          recipient_email: string;
          recipient_name: string | null;
          token: string | null;
          kind: 'link' | 'email' | 'recruiter_invite';
          message: string | null;
          expires_at: string | null;
          last_viewed_at: string | null;
          view_count: number;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          proof_id: string;
          owner_id: string;
          recipient_email: string;
          recipient_name?: string | null;
          token?: string | null;
          kind?: 'link' | 'email' | 'recruiter_invite';
          message?: string | null;
          expires_at?: string | null;
          last_viewed_at?: string | null;
          view_count?: number;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          proof_id?: string;
          owner_id?: string;
          recipient_email?: string;
          recipient_name?: string | null;
          token?: string | null;
          kind?: 'link' | 'email' | 'recruiter_invite';
          message?: string | null;
          expires_at?: string | null;
          last_viewed_at?: string | null;
          view_count?: number;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'proof_shares_proof_id_fkey';
            columns: ['proof_id'];
            isOneToOne: false;
            referencedRelation: 'proof_cards';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'proof_shares_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      proof_views: {
        Row: {
          id: string;
          proof_id: string;
          owner_id: string;
          viewer_user_id: string | null;
          ip_address: string | null;
          user_agent: string | null;
          referer: string | null;
          viewed_at: string;
        };
        Insert: {
          id?: string;
          proof_id: string;
          owner_id: string;
          viewer_user_id?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          referer?: string | null;
          viewed_at?: string;
        };
        Update: {
          id?: string;
          proof_id?: string;
          owner_id?: string;
          viewer_user_id?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          referer?: string | null;
          viewed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'proof_views_proof_id_fkey';
            columns: ['proof_id'];
            isOneToOne: false;
            referencedRelation: 'proof_cards';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'proof_views_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'proof_views_viewer_user_id_fkey';
            columns: ['viewer_user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      user_opportunities: {
        Row: {
          id: string;
          user_id: string;
          opportunity_id: string;
          status: string;
          match_score: number | null;
          notes: string | null;
          applied_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          opportunity_id: string;
          status?: string;
          match_score?: number | null;
          notes?: string | null;
          applied_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          opportunity_id?: string;
          status?: string;
          match_score?: number | null;
          notes?: string | null;
          applied_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_opportunities_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_opportunities_opportunity_id_fkey';
            columns: ['opportunity_id'];
            isOneToOne: false;
            referencedRelation: 'opportunities';
            referencedColumns: ['id'];
          },
        ];
      };
      contact_messages: {
        Row: {
          id: string;
          name: string;
          email: string;
          subject: string | null;
          message: string;
          status: 'new' | 'in_progress' | 'resolved' | 'spam';
          user_id: string | null;
          ip_address: string | null;
          user_agent: string | null;
          assigned_to: string | null;
          resolved_at: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          subject?: string | null;
          message: string;
          status?: 'new' | 'in_progress' | 'resolved' | 'spam';
          user_id?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          assigned_to?: string | null;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          subject?: string | null;
          message?: string;
          status?: 'new' | 'in_progress' | 'resolved' | 'spam';
          user_id?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          assigned_to?: string | null;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'contact_messages_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'contact_messages_assigned_to_fkey';
            columns: ['assigned_to'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: 'recruiter_view' | 'verification_update' | 'opportunity_match' | 'coach_tip' | 'weekly_summary' | 'system';
          title: string;
          body: string | null;
          link: string | null;
          payload: Record<string, unknown>;
          read_at: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'recruiter_view' | 'verification_update' | 'opportunity_match' | 'coach_tip' | 'weekly_summary' | 'system';
          title: string;
          body?: string | null;
          link?: string | null;
          payload?: Record<string, unknown>;
          read_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: 'recruiter_view' | 'verification_update' | 'opportunity_match' | 'coach_tip' | 'weekly_summary' | 'system';
          title?: string;
          body?: string | null;
          link?: string | null;
          payload?: Record<string, unknown>;
          read_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'notifications_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      notification_preferences: {
        Row: {
          user_id: string;
          weekly_summary: boolean;
          recruiter_views: boolean;
          verification_status: boolean;
          opportunity_match: boolean;
          coach_tips: boolean;
          product_updates: boolean;
          updated_at: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          weekly_summary?: boolean;
          recruiter_views?: boolean;
          verification_status?: boolean;
          opportunity_match?: boolean;
          coach_tips?: boolean;
          product_updates?: boolean;
          updated_at?: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          weekly_summary?: boolean;
          recruiter_views?: boolean;
          verification_status?: boolean;
          opportunity_match?: boolean;
          coach_tips?: boolean;
          product_updates?: boolean;
          updated_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notification_preferences_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      user_integrations: {
        Row: {
          id: string;
          user_id: string;
          provider: 'email' | 'google' | 'github' | 'apple' | 'linkedin';
          external_user_id: string | null;
          external_username: string | null;
          access_token: string | null;
          refresh_token: string | null;
          token_expires_at: string | null;
          scopes: string[];
          status: 'connected' | 'disconnected' | 'pending' | 'error';
          last_synced_at: string | null;
          metadata: Record<string, unknown>;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          provider: 'email' | 'google' | 'github' | 'apple' | 'linkedin';
          external_user_id?: string | null;
          external_username?: string | null;
          access_token?: string | null;
          refresh_token?: string | null;
          token_expires_at?: string | null;
          scopes?: string[];
          status?: 'connected' | 'disconnected' | 'pending' | 'error';
          last_synced_at?: string | null;
          metadata?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          provider?: 'email' | 'google' | 'github' | 'apple' | 'linkedin';
          external_user_id?: string | null;
          external_username?: string | null;
          access_token?: string | null;
          refresh_token?: string | null;
          token_expires_at?: string | null;
          scopes?: string[];
          status?: 'connected' | 'disconnected' | 'pending' | 'error';
          last_synced_at?: string | null;
          metadata?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'user_integrations_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan: 'free' | 'pro' | 'team';
          status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
          current_period_start: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          metadata: Record<string, unknown>;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan?: 'free' | 'pro' | 'team';
          status?: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          metadata?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan?: 'free' | 'pro' | 'team';
          status?: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          metadata?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'subscriptions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      audit_log: {
        Row: {
          id: string;
          actor_id: string | null;
          actor_role: 'user' | 'admin' | 'moderator' | null;
          action: string;
          entity_type: string | null;
          entity_id: string | null;
          old_data: Record<string, unknown> | null;
          new_data: Record<string, unknown> | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          actor_role?: 'user' | 'admin' | 'moderator' | null;
          action: string;
          entity_type?: string | null;
          entity_id?: string | null;
          old_data?: Record<string, unknown> | null;
          new_data?: Record<string, unknown> | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_id?: string | null;
          actor_role?: 'user' | 'admin' | 'moderator' | null;
          action?: string;
          entity_type?: string | null;
          entity_id?: string | null;
          old_data?: Record<string, unknown> | null;
          new_data?: Record<string, unknown> | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'audit_log_actor_id_fkey';
            columns: ['actor_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: 'user' | 'admin' | 'moderator';
      account_status: 'active' | 'pending' | 'suspended' | 'deactivated';
      student_year: 'first' | 'second' | 'third' | 'fourth' | 'graduate';
      proof_source_type: 'github' | 'kaggle' | 'certificate' | 'hackathon' | 'project' | 'blog' | 'demo' | 'other';
      verification_status: 'draft' | 'pending' | 'verified' | 'rejected';
      visibility_status: 'private' | 'unlisted' | 'public';
      opportunity_type: 'internship' | 'job' | 'scholarship' | 'mentorship' | 'hackathon' | 'research' | 'other';
      coach_note_type: 'daily' | 'weekly' | 'milestone' | 'ad_hoc';
      integration_status: 'connected' | 'disconnected' | 'pending' | 'error';
      auth_provider: 'email' | 'google' | 'github' | 'apple' | 'linkedin';
      contact_status: 'new' | 'in_progress' | 'resolved' | 'spam';
      notification_type: 'recruiter_view' | 'verification_update' | 'opportunity_match' | 'coach_tip' | 'weekly_summary' | 'system';
      share_token_kind: 'link' | 'email' | 'recruiter_invite';
      subscription_plan: 'free' | 'pro' | 'team';
      subscription_status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
      opportunity_status: 'saved' | 'applied' | 'dismissed' | 'interviewing' | 'rejected' | 'offered';
    };
    CompositeTypes: Record<string, never>;
  };
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Browser-side Supabase client using @supabase/ssr
 * Stores session in cookies (NOT localStorage) so middleware can read it
 */
export const supabase: SupabaseClient<Database> | null =
  supabaseUrl && supabaseAnonKey
    ? createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
    : null;
