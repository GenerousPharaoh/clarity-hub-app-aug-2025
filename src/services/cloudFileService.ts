/**
 * Cloud File Service - Pure Cloud-Native File Management
 * 
 * Replaces IndexedDB with direct Supabase Storage integration
 * All files stored in cloud with real-time sync
 * 
 * SECURITY ENHANCED:
 * - File validation and sanitization
 * - Path traversal prevention
 * - File type validation
 * - Size limits enforcement
 */

import { supabase } from '../lib/supabase';
import { v4 as uuid } from 'uuid';
import { FileValidationService } from './fileValidationService';

export interface CloudFile {
  id: string;
  name: string;
  size: number;
  type: string;
  project_id: string;
  owner_id: string;
  storage_path: string;
  public_url?: string;
  exhibit_id?: string;
  exhibit_title?: string;
  processing_status: 'uploading' | 'processing' | 'completed' | 'failed';
  ai_insights?: any[];
  content_text?: string;
  created_at: string;
  processed_at?: string;
}

class CloudFileService {
  private bucketName = 'project-files';

  /**
   * Upload file directly to Supabase Storage with security validation
   */
  async uploadFile(
    file: File,
    projectId: string,
    userId: string,
    onProgress?: (progress: number) => void
  ): Promise<CloudFile> {
    // SECURITY: Validate file before processing
    const validation = FileValidationService.validateFile(file);
    if (!validation.isValid) {
      throw new Error(`File validation failed: ${validation.errors.join(', ')}`);
    }

    const fileId = uuid();
    // SECURITY: Use safe path generation to prevent path traversal
    const fileName = FileValidationService.generateSafeStoragePath(userId, projectId, file.name);

    try {
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.bucketName)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
            if (onProgress) {
              const percentage = (progress.loaded / progress.total) * 100;
              onProgress(percentage);
            }
          }
        } as any);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(fileName);

      // Create database record with sanitized data
      const fileRecord: Partial<CloudFile> = {
        id: fileId,
        name: validation.sanitizedFileName, // Use sanitized filename
        size: file.size,
        type: file.type,
        project_id: projectId,
        owner_id: userId,
        storage_path: fileName,
        public_url: urlData.publicUrl,
        processing_status: 'processing',
        created_at: new Date().toISOString()
      };

      // Insert into database
      const { data: dbData, error: dbError } = await supabase
        .from('files')
        .insert(fileRecord)
        .select()
        .single();

      if (dbError) {
        // Cleanup storage if database insert fails
        await supabase.storage.from(this.bucketName).remove([fileName]);
        throw dbError;
      }

      return dbData as CloudFile;
    } catch (error) {
      console.error('File upload failed:', error);
      throw error;
    }
  }

  /**
   * Get all files for a project
   */
  async getProjectFiles(projectId: string): Promise<CloudFile[]> {
    // Validate projectId to prevent undefined queries
    if (!projectId || projectId === 'undefined') {
      console.warn('getProjectFiles called with invalid projectId:', projectId);
      return [];
    }

    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get file by ID
   */
  async getFile(fileId: string): Promise<CloudFile | null> {
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('id', fileId)
      .single();

    if (error) {
      console.error('Failed to get file:', error);
      return null;
    }

    return data;
  }

  /**
   * Update file metadata (exhibit info, etc)
   */
  async updateFile(fileId: string, updates: Partial<CloudFile>): Promise<CloudFile> {
    const { data, error } = await supabase
      .from('files')
      .update(updates)
      .eq('id', fileId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete file from storage and database
   */
  async deleteFile(fileId: string): Promise<void> {
    // Get file info first
    const file = await this.getFile(fileId);
    if (!file) throw new Error('File not found');

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(this.bucketName)
      .remove([file.storage_path]);

    if (storageError) throw storageError;

    // Delete from database
    const { error: dbError } = await supabase
      .from('files')
      .delete()
      .eq('id', fileId);

    if (dbError) throw dbError;
  }

  /**
   * Get signed URL for private file access
   */
  async getSignedUrl(fileId: string, expiresIn = 3600): Promise<string> {
    const file = await this.getFile(fileId);
    if (!file) throw new Error('File not found');

    const { data, error } = await supabase.storage
      .from(this.bucketName)
      .createSignedUrl(file.storage_path, expiresIn);

    if (error) throw error;
    return data.signedUrl;
  }

  /**
   * Download file
   */
  async downloadFile(fileId: string): Promise<Blob> {
    const file = await this.getFile(fileId);
    if (!file) throw new Error('File not found');

    const { data, error } = await supabase.storage
      .from(this.bucketName)
      .download(file.storage_path);

    if (error) throw error;
    return data;
  }

  /**
   * Search files by name or content
   */
  async searchFiles(
    projectId: string,
    query: string
  ): Promise<CloudFile[]> {
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('project_id', projectId)
      .or(`name.ilike.%${query}%,content_text.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get files by exhibit ID
   */
  async getExhibitFiles(projectId: string, exhibitId: string): Promise<CloudFile[]> {
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('project_id', projectId)
      .eq('exhibit_id', exhibitId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Generate next exhibit ID
   */
  async generateExhibitId(projectId: string, fileType: string): Promise<string> {
    // Determine prefix based on file type
    let prefix = 'D'; // Default to Document
    if (fileType.startsWith('image')) prefix = 'P'; // Photo
    else if (fileType.startsWith('video')) prefix = 'V'; // Video
    else if (fileType.startsWith('audio')) prefix = 'A'; // Audio

    // Get existing exhibits with this prefix
    const { data } = await supabase
      .from('files')
      .select('exhibit_id')
      .eq('project_id', projectId)
      .like('exhibit_id', `${prefix}%`)
      .order('exhibit_id', { ascending: false })
      .limit(1);

    if (!data || data.length === 0) {
      return `${prefix}1`;
    }

    // Extract number and increment
    const lastNumber = parseInt(data[0].exhibit_id.substring(1)) || 0;
    return `${prefix}${lastNumber + 1}`;
  }

  /**
   * Subscribe to real-time file updates
   */
  subscribeToFileUpdates(
    projectId: string,
    callback: (payload: any) => void
  ) {
    // Validate projectId to prevent undefined queries
    if (!projectId || projectId === 'undefined') {
      console.warn('subscribeToFileUpdates called with invalid projectId:', projectId);
      return {
        unsubscribe: () => {
          console.warn('Unsubscribe called on invalid subscription');
        }
      };
    }
    
    return supabase
      .channel(`files_${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'files',
          filter: `project_id=eq.${projectId}`
        },
        callback
      )
      .subscribe();
  }
}

export const cloudFileService = new CloudFileService();
export default cloudFileService;