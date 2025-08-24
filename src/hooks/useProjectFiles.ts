import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { uploadFile, getPublicUrl } from '../services/storageService';
import fileProcessingService from '../services/fileProcessingService';
import useAppStore from '../store';
import { demoService, DEMO_USER_ID, DEMO_PROJECT_ID } from '../services/demoService';

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
      // Use demo project ID if in demo mode
      const targetProjectId = window.DEMO_MODE ? DEMO_PROJECT_ID : projectId;
      
      if (!targetProjectId || targetProjectId === 'undefined') {
        console.warn('useProjectFiles called with invalid projectId:', targetProjectId);
        return [];
      }
      
      // Use demo service for demo mode
      if (window.DEMO_MODE) {
        const demoFiles = await demoService.getDemoFiles();
        // Convert demo files to FileRecord format
        return demoFiles.map(file => ({
          ...file,
          metadata: typeof file.metadata === 'object' ? file.metadata : {},
          file_type: file.file_type || determineFileType(file.name, file.content_type || ''),
        })) as FileRecord[];
      }
      
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('project_id', targetProjectId)
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
/**
 * Custom hook to get file processing status and AI analysis results
 */
export function useFileProcessingStatus(fileId: string | null) {
  return useQuery({
    queryKey: ['file_processing_status', fileId],
    queryFn: async () => {
      if (!fileId) return null;
      
      const { data, error } = await supabase.functions.invoke('process-document', {
        body: {
          action: 'get_status',
          file_id: fileId
        }
      });
      
      if (error) {
        console.error('Error fetching processing status:', error);
        throw error;
      }
      
      return data?.status || null;
    },
    enabled: !!fileId,
    refetchInterval: (data) => {
      // Refetch every 5 seconds if still processing
      return data?.processing_status === 'processing' ? 5000 : false;
    },
    staleTime: 10000 // Consider data stale after 10 seconds
  });
}

/**
 * Custom hook to get processed content and AI insights for a file
 */
export function useProcessedContent(fileId: string | null) {
  return useQuery({
    queryKey: ['processed_content', fileId],
    queryFn: async () => {
      if (!fileId) return null;
      
      const { data, error } = await supabase
        .from('processed_content')
        .select(`
          *,
          files!inner(name, metadata, content_type)
        `)
        .eq('file_id', fileId)
        .single();
      
      if (error && error.code !== 'PGRST116') { // Not found is OK
        console.error('Error fetching processed content:', error);
        throw error;
      }
      
      return data || null;
    },
    enabled: !!fileId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  });
}

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
        // Only validate API connection if not in demo mode
        if (!window.DEMO_MODE && userId !== '00000000-0000-0000-0000-000000000000') {
          try {
            const { data: testConnection, error: testError } = await supabase.auth.getSession();
            
            if (testError) {
              console.warn('Session validation failed, switching to demo mode:', testError);
              // Don't throw error, just continue with demo mode
            }
            
            if (!testConnection?.session?.access_token) {
              console.warn('No valid session token found, using demo mode');
              // Don't throw error, just continue with demo mode
            }
          } catch (sessionError) {
            console.warn('Session check failed, continuing with demo mode:', sessionError);
          }
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
          
          // Check if we are in demo mode (check user ID or window.DEMO_MODE)
          const isDemoMode = userId === 'demo-user-123' || 
                           userId === '00000000-0000-0000-0000-000000000000' || 
                           window.DEMO_MODE;
          
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
            
            // Trigger AI processing for analysis in the background
            setTimeout(async () => {
              try {
                console.log('Triggering AI processing for file:', fileData.id);
                
                // Queue file for AI processing using the new Edge Function
                const { data: queueResult, error: queueError } = await supabase.functions.invoke('process-document', {
                  body: {
                    action: 'process_file',
                    file_id: fileData.id,
                    project_id: projectId
                  }
                });
                
                if (queueError) {
                  console.error('Failed to queue file for AI processing:', queueError);
                  // Fall back to legacy processing
                  fileProcessingService.processFile(
                    fileData.id,
                    fileData.storage_path,
                    fileData.file_type,
                    fileData.content_type
                  ).catch(err => {
                    console.error('Background file processing error:', err);
                  });
                } else {
                  console.log('File queued for AI processing:', queueResult);
                  
                  // Update query cache to reflect processing status
                  queryClient.setQueryData(['files', projectId], (oldData: FileRecord[]) => 
                    oldData ? oldData.map(f => 
                      f.id === fileData.id 
                        ? { ...f, processing_status: 'processing' }
                        : f
                    ) : oldData
                  );
                }
              } catch (processingError) {
                console.error('Error triggering AI processing:', processingError);
                // Fall back to legacy processing
                fileProcessingService.processFile(
                  fileData.id,
                  fileData.storage_path,
                  fileData.file_type,
                  fileData.content_type
                ).catch(err => {
                  console.error('Background file processing error:', err);
                });
              }
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
          
          // Auto-detect exhibit ID from filename and create exhibit if needed
          const detectExhibitIdFromFilename = useAppStore.getState().detectExhibitIdFromFilename;
          const createExhibitFromFile = useAppStore.getState().createExhibitFromFile;
          const exhibits = useAppStore.getState().exhibits.filter(e => e.project_id === projectId);
          
          const detectedExhibitId = detectExhibitIdFromFilename(file.name);
          if (detectedExhibitId && fileData) {
            console.log('Auto-detected exhibit ID from filename:', detectedExhibitId);
            
            // Check if exhibit already exists
            const existingExhibit = exhibits.find(e => e.exhibit_id === detectedExhibitId);
            
            if (!existingExhibit) {
              // Create new exhibit from this file
              console.log('Creating new exhibit:', detectedExhibitId);
              createExhibitFromFile(fileData.id, detectedExhibitId, `Exhibit ${detectedExhibitId}`);
            } else {
              // Assign file to existing exhibit
              console.log('Assigning file to existing exhibit:', detectedExhibitId);
              const assignFileToExhibit = useAppStore.getState().assignFileToExhibit;
              assignFileToExhibit(fileData.id, detectedExhibitId, !existingExhibit.files.length);
            }
            
            // Update the fileData with exhibit_id for consistency
            fileData = { ...fileData, exhibit_id: detectedExhibitId };
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