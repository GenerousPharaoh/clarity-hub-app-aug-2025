import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { uploadFile, getPublicUrl } from '../services/storageService';
import fileProcessingService from '../services/fileProcessingService';

// Define common file categories and their extensions
const FILE_TYPES = {
  DOCUMENT: ['pdf', 'doc', 'docx', 'odt', 'rtf', 'txt', 'md'],
  SPREADSHEET: ['xls', 'xlsx', 'csv', 'ods', 'numbers'],
  PRESENTATION: ['ppt', 'pptx', 'odp', 'key'],
  IMAGE: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff', 'heic', 'heif'],
  VIDEO: ['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', 'wmv', 'm4v'],
  AUDIO: ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a', 'wma'],
  CODE: ['html', 'css', 'js', 'ts', 'jsx', 'tsx', 'json', 'xml', 'py', 'java', 'c', 'cpp', 'php', 'rb', 'go', 'swift'],
  ARCHIVE: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'],
  OTHER: [],
};

export interface FileRecord {
  id: string;
  project_id: string;
  name: string;
  exhibit_id?: string;
  storage_path: string;
  content_type: string;
  size: number;
  file_type: string;
  metadata: {
    thumbnailUrl?: string;
    tags?: string[];
    fileType?: string;
    uploadTimestamp?: number;
    originalFileName?: string;
    fileExtension?: string;
    mimeType?: string;
    textContent?: string; 
    processingStatus?: 'pending' | 'processing' | 'completed' | 'failed';
    extractedData?: Record<string, any>;
  };
  added_at: string;
  owner_id: string;
  uploaded_by_user_id?: string;
}

export interface UploadProgressEvent {
  loaded: number;
  total: number;
}

// Determine file type based on extension and MIME type
export function determineFileType(fileName: string, mimeType: string): string {
  const fileExt = fileName.split('.').pop()?.toLowerCase() || '';
  
  // First check by MIME type
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType === 'application/pdf') return 'pdf';
  
  // Then check by extension
  for (const [type, extensions] of Object.entries(FILE_TYPES)) {
    if (extensions.includes(fileExt)) {
      return type.toLowerCase();
    }
  }
  
  // Default file type
  return 'document';
}

/**
 * Custom hook to fetch project files with proper type safety
 * Always returns an array (never null, undefined, or an object)
 */
export function useProjectFiles(projectId: string | null) {
  return useQuery<FileRecord[], Error>({
    queryKey: ['files', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('project_id', projectId)
        .order('added_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching files:', error);
        throw error;
      }
      
      // Convert the response data to match our FileRecord type
      // This handles the JSON metadata correctly
      const typedData: FileRecord[] = data ? data.map(file => ({
        ...file,
        metadata: typeof file.metadata === 'object' ? file.metadata : {}, // Ensure metadata is an object
      })) : [];
      
      // Ensure we always return an array, never null or undefined
      return typedData;
    },
    // Don't run the query if projectId is null
    enabled: !!projectId,
    // Cache for 5 minutes
    staleTime: 5 * 60 * 1000,
    // Retry up to 3 times
    retry: 3,
    // Don't refetch on window focus to avoid unwanted refreshes
    refetchOnWindowFocus: false
  });
}

/**
 * Custom hook to upload a file to Supabase storage and add its record to the files table
 * Enhanced with progress reporting, better error handling, and AI file analysis
 */
export function useFileUpload() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      file, 
      projectId, 
      userId,
      onProgress,
    }: { 
      file: File; 
      projectId: string; 
      userId: string;
      onProgress?: (progress: UploadProgressEvent) => void;
    }) => {
      if (!file || !projectId || !userId) {
        throw new Error('Missing required parameters: file, projectId, or userId');
      }
      
      try {
        // Validate that we have API connection before attempting upload
        const { data: testConnection, error: testError } = await supabase.auth.getSession();
        
        if (testError) {
          console.error('Session validation failed:', testError);
          throw new Error(`API connection error: ${testError.message}`);
        }
        
        if (!testConnection?.session?.access_token) {
          console.error('No valid session token found');
          throw new Error('Authentication error: No API key found in request');
        }
        
        console.log('Starting file upload process', { 
          name: file.name, 
          size: file.size, 
          type: file.type,
          projectId: projectId 
        });
        
        // Extract the file extension
        const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
        
        // Determine file type using our helper function
        const fileType = determineFileType(file.name, file.type);
        
        // Generate a unique ID for the file
        const fileId = crypto.randomUUID();
        
        // Create a storage path with the unique ID to avoid name conflicts
        // Format: {bucket}/projects/{projectId}/{fileId}_{fileName}
        const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const storagePath = `projects/${projectId}/${fileId}_${safeFileName}`;
        const bucket = 'files';
        
        // Upload to storage using our enhanced storage service
        console.log(`Uploading file to ${bucket}/${storagePath}`);
        
        try {
          // Upload the file using our enhanced storage service
          const uploadResult = await uploadFile(bucket, storagePath, file, {
            onProgress,
            upsert: true,
            cacheControl: '3600'
          });
          
          // Get the public URL
          const publicUrl = uploadResult.publicUrl || getPublicUrl(bucket, storagePath);
          
          console.log('File uploaded successfully', { 
            path: uploadResult.path, 
            publicUrl 
          });
          
          // Call onProgress one last time to ensure 100%
          if (onProgress) {
            onProgress({ loaded: file.size, total: file.size });
          }
          
          // Get AI-based file analysis and title suggestions
          let suggestedTitle = file.name;
          let suggestedTags = [];
          let fileDescription = '';
          
          try {
            console.log('Requesting AI analysis for file naming and organization');
            
            const aiResponse = await supabase.functions.invoke('suggest-filename', {
              body: {
                fileId: fileId,
                storagePath,
                contentType: file.type,
                fileName: file.name,
                fileType: fileType
              }
            });
            
            if (!aiResponse.error && aiResponse.data?.suggestions) {
              const { suggestions } = aiResponse.data;
              suggestedTitle = suggestions.suggestedTitle || file.name;
              suggestedTags = suggestions.suggestedTags || [];
              fileDescription = suggestions.description || '';
              
              console.log('Received AI suggestions:', {
                title: suggestedTitle,
                tags: suggestedTags,
                description: fileDescription
              });
            } else if (aiResponse.error) {
              console.warn('Error getting file name suggestions:', aiResponse.error);
            }
          } catch (aiError) {
            console.error('Error analyzing file with AI:', aiError);
            // Continue with upload even if AI analysis fails
          }
          
          // Create enhanced metadata
          const fileMetadata = {
            thumbnailUrl: fileType === 'image' ? publicUrl : null,
            tags: suggestedTags,
            fileType: fileType,
            uploadTimestamp: Date.now(),
            originalFileName: file.name,
            suggestedTitle: suggestedTitle,
            description: fileDescription,
            fileExtension: fileExt,
            mimeType: file.type,
            processingStatus: 'pending',
          };
          
          // Check if we are in demo mode (projectId not a valid UUID)
          const isDemoMode = userId === 'demo-user-123';
          
          if (isDemoMode) {
            console.log('Creating local file record (demo mode)');
            // Create a client-side file record with a UUID
            const mockFileData = {
              id: fileId,
              name: suggestedTitle, // Use AI-suggested title if available
              project_id: projectId,
              owner_id: userId,
              uploaded_by_user_id: userId,
              storage_path: storagePath,
              content_type: file.type,
              size: file.size,
              file_type: fileType,
              metadata: fileMetadata,
              added_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            
            // Update the query cache directly in demo mode
            queryClient.setQueryData(['files', projectId], (oldData: any) => 
              [mockFileData, ...(oldData || [])]
            );
            
            return mockFileData;
          }
          
          // For non-demo mode, create database record
          console.log('Creating database record for file');
          
          // Create database record or use fallback object
          let fileData = null;
          
          try {
            const result = await supabase
              .from('files')
              .insert([
                {
                  name: suggestedTitle, // Use AI-suggested title if available
                  project_id: projectId,
                  storage_path: storagePath,
                  content_type: file.type,
                  size: file.size,
                  file_type: fileType,
                  metadata: fileMetadata,
                  owner_id: userId,
                  uploaded_by_user_id: userId,
                  id: fileId // Use our generated UUID for consistency
                }
              ])
              .select('*')
              .single();
            
            if (result.error) {
              console.error('Error creating file record:', result.error);
              throw result.error;
            } 
            
            fileData = result.data;
            
            // Trigger file processing for analysis in the background
            setTimeout(() => {
              fileProcessingService.processFile(
                fileData.id,
                fileData.storage_path,
                fileData.file_type,
                fileData.content_type
              ).catch(err => {
                console.error('Background file processing error:', err);
              });
            }, 100);
            
            console.log('File record created successfully:', fileData?.id);
          } catch (dbError) {
            console.error('Exception creating file record:', dbError);
            
            // Attempt to clean up the storage file if database insert fails
            try {
              await supabase.storage.from(bucket).remove([storagePath]);
              console.log('Cleaned up storage file after database insert failed');
            } catch (cleanupError) {
              console.error('Failed to clean up storage file:', cleanupError);
            }
            
            throw new Error(`Failed to create file record: ${dbError.message}`);
          }
          
          return fileData;
        } catch (uploadError: any) {
          console.error('Error during file upload:', uploadError);
          
          // Make sure we provide a useful error message
          const errorMessage = uploadError?.message || 'Unknown upload error';
          throw new Error(`Storage upload failed: ${errorMessage}`);
        }
      } catch (error: any) {
        console.error('File upload process error:', error);
        throw error;
      }
    },
    
    // Invalidate and refetch files query after successful upload
    onSuccess: (data) => {
      if (data && data.project_id) {
        queryClient.invalidateQueries({ queryKey: ['files', data.project_id] });
      }
    }
  });
} 