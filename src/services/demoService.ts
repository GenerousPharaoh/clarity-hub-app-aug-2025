/**
 * Demo Service - Persistent Demo Account Management
 * 
 * Manages a persistent demo account with real database storage
 * Demo data persists across sessions for a realistic experience
 */

import { supabase } from '../lib/supabase';
import { v4 as uuid } from 'uuid';

// Fixed demo user ID for persistence
export const DEMO_USER_ID = '11111111-1111-1111-1111-111111111111';
export const DEMO_PROJECT_ID = '22222222-2222-2222-2222-222222222222';

export interface DemoUser {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  created_at: string;
}

export interface DemoProject {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

class DemoService {
  /**
   * Initialize demo user and project if they don't exist
   */
  async initializeDemoAccount(): Promise<{ user: DemoUser; project: DemoProject }> {
    try {
      // Check if demo user exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', DEMO_USER_ID)
        .single();

      let demoUser: DemoUser;
      
      if (!existingUser) {
        // Create demo user profile
        const { data: newUser, error: userError } = await supabase
          .from('profiles')
          .insert({
            id: DEMO_USER_ID,
            email: 'demo@clarityhub.ai',
            full_name: 'Demo User',
            avatar_url: 'https://ui-avatars.com/api/?name=Demo+User&background=3B82F6&color=fff',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (userError) {
          console.error('Failed to create demo user:', userError);
          // Return a fallback user object
          demoUser = {
            id: DEMO_USER_ID,
            email: 'demo@clarityhub.ai',
            full_name: 'Demo User',
            avatar_url: 'https://ui-avatars.com/api/?name=Demo+User&background=3B82F6&color=fff',
            created_at: new Date().toISOString()
          };
        } else {
          demoUser = newUser;
        }
      } else {
        demoUser = existingUser;
      }

      // Check if demo project exists
      const { data: existingProject } = await supabase
        .from('projects')
        .select('*')
        .eq('id', DEMO_PROJECT_ID)
        .single();

      let demoProject: DemoProject;

      if (!existingProject) {
        // Create demo project
        const { data: newProject, error: projectError } = await supabase
          .from('projects')
          .insert({
            id: DEMO_PROJECT_ID,
            name: 'Demo Legal Case',
            description: 'This is a demo project showcasing Clarity Hub capabilities. Upload files, analyze documents, and explore AI-powered legal insights.',
            owner_id: DEMO_USER_ID,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (projectError) {
          console.error('Failed to create demo project:', projectError);
          // Return a fallback project object
          demoProject = {
            id: DEMO_PROJECT_ID,
            name: 'Demo Legal Case',
            description: 'This is a demo project showcasing Clarity Hub capabilities.',
            owner_id: DEMO_USER_ID,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        } else {
          demoProject = newProject;
        }
      } else {
        demoProject = existingProject;
      }

      // Ensure project_users relationship exists
      const { error: relationError } = await supabase
        .from('projects_users')
        .upsert({
          project_id: DEMO_PROJECT_ID,
          user_id: DEMO_USER_ID,
          role: 'owner',
          created_at: new Date().toISOString()
        }, {
          onConflict: 'project_id,user_id'
        });

      if (relationError) {
        console.warn('Failed to create project-user relationship:', relationError);
      }

      return { user: demoUser, project: demoProject };
    } catch (error) {
      console.error('Failed to initialize demo account:', error);
      
      // Return fallback objects
      return {
        user: {
          id: DEMO_USER_ID,
          email: 'demo@clarityhub.ai',
          full_name: 'Demo User',
          avatar_url: 'https://ui-avatars.com/api/?name=Demo+User&background=3B82F6&color=fff',
          created_at: new Date().toISOString()
        },
        project: {
          id: DEMO_PROJECT_ID,
          name: 'Demo Legal Case',
          description: 'This is a demo project showcasing Clarity Hub capabilities.',
          owner_id: DEMO_USER_ID,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Get demo files
   */
  async getDemoFiles(): Promise<any[]> {
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('project_id', DEMO_PROJECT_ID)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to get demo files:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Upload file for demo user
   */
  async uploadDemoFile(file: File, onProgress?: (progress: number) => void): Promise<any> {
    const fileId = uuid();
    const fileExt = file.name.split('.').pop();
    const fileName = `${DEMO_USER_ID}/${DEMO_PROJECT_ID}/${fileId}.${fileExt}`;

    try {
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('project-files')
        .getPublicUrl(fileName);

      // Create database record
      const fileRecord = {
        id: fileId,
        name: file.name,
        size: file.size,
        file_type: file.type,
        project_id: DEMO_PROJECT_ID,
        owner_id: DEMO_USER_ID,
        storage_path: fileName,
        public_url: urlData.publicUrl,
        processing_status: 'completed',
        added_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Insert into database
      const { data: dbData, error: dbError } = await supabase
        .from('files')
        .insert(fileRecord)
        .select()
        .single();

      if (dbError) {
        // Try to cleanup storage if database insert fails
        await supabase.storage.from('project-files').remove([fileName]);
        throw dbError;
      }

      return dbData;
    } catch (error) {
      console.error('Demo file upload failed:', error);
      throw error;
    }
  }

  /**
   * Clean up old demo files (optional - for maintenance)
   */
  async cleanupOldDemoFiles(daysOld: number = 7): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    try {
      // Get old files
      const { data: oldFiles, error: fetchError } = await supabase
        .from('files')
        .select('id, storage_path')
        .eq('project_id', DEMO_PROJECT_ID)
        .lt('created_at', cutoffDate.toISOString());

      if (fetchError) throw fetchError;

      if (oldFiles && oldFiles.length > 0) {
        // Delete from storage
        const paths = oldFiles.map(f => f.storage_path).filter(Boolean);
        if (paths.length > 0) {
          await supabase.storage.from('project-files').remove(paths);
        }

        // Delete from database
        const ids = oldFiles.map(f => f.id);
        await supabase
          .from('files')
          .delete()
          .in('id', ids);

        console.log(`Cleaned up ${oldFiles.length} old demo files`);
      }
    } catch (error) {
      console.error('Failed to cleanup old demo files:', error);
    }
  }
}

export const demoService = new DemoService();