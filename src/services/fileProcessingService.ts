import { supabase } from '../lib/supabase';
import { FileRecord } from '../hooks/useProjectFiles';

/**
 * Service for processing and analyzing various file types
 * Handles multimedia content analysis, text extraction, and AI integration
 */
export const fileProcessingService = {
  /**
   * Process file after upload to extract and analyze content
   * @param fileId The ID of the file to process
   * @param filePath Storage path of the file
   * @param fileType The detected file type
   * @param contentType The MIME type of the file
   */
  async processFile(fileId: string, filePath: string, fileType: string, contentType: string): Promise<void> {
    console.log(`Processing file ${fileId} of type ${fileType}`);
    
    try {
      // Different processing based on file type
      if (fileType === 'image') {
        await this.processImageFile(fileId, filePath);
      } else if (fileType === 'pdf' || fileType === 'document') {
        await this.processDocumentFile(fileId, filePath);
      } else if (fileType === 'audio') {
        await this.processAudioFile(fileId, filePath);
      } else if (fileType === 'video') {
        await this.processVideoFile(fileId, filePath);
      }
      
      // Mark file as processed in the database
      await this.updateFileProcessingStatus(fileId, 'completed');
      
    } catch (error) {
      console.error('Error processing file:', error);
      await this.updateFileProcessingStatus(fileId, 'failed', { error: String(error) });
    }
  },
  
  /**
   * Process image files for analysis and metadata extraction
   */
  async processImageFile(fileId: string, filePath: string): Promise<void> {
    // Download the file
    const { data, error } = await supabase.storage
      .from('files')
      .download(filePath);
      
    if (error) {
      throw new Error(`Error downloading image: ${error.message}`);
    }
    
    // Convert to base64 for AI analysis
    const base64 = await this.fileToBase64(data);
    
    // Use Edge Function to analyze image
    const response = await supabase.functions.invoke('analyze-file', {
      body: {
        fileId,
        task: 'analyze_image',
        base64Image: base64
      }
    });
    
    if (response.error) {
      throw new Error(`Error analyzing image: ${response.error.message}`);
    }
    
    // Update file metadata with analysis results
    if (response.data?.analysis) {
      await this.updateFileMetadata(fileId, {
        imageAnalysis: response.data.analysis,
        processingStatus: 'completed'
      });
    }
  },
  
  /**
   * Process document files for text extraction and analysis
   */
  async processDocumentFile(fileId: string, filePath: string): Promise<void> {
    // Use Edge Function to analyze document
    const response = await supabase.functions.invoke('analyze-file', {
      body: {
        fileId,
        storagePath: filePath,
        task: 'analyze_document'
      }
    });
    
    if (response.error) {
      throw new Error(`Error analyzing document: ${response.error.message}`);
    }
    
    // Update file metadata with analysis results
    if (response.data?.analysis) {
      await this.updateFileMetadata(fileId, {
        documentAnalysis: response.data.analysis,
        processingStatus: 'completed'
      });
    }
  },
  
  /**
   * Process audio files for transcription and analysis
   */
  async processAudioFile(fileId: string, filePath: string): Promise<void> {
    // For now, just mark as processed
    // In a full implementation, this would send to a transcription service
    await this.updateFileMetadata(fileId, {
      audioProcessed: true,
      processingStatus: 'completed'
    });
  },
  
  /**
   * Process video files for analysis
   */
  async processVideoFile(fileId: string, filePath: string): Promise<void> {
    // For now, just mark as processed
    // In a full implementation, this would extract thumbnails and potentially transcribe audio
    await this.updateFileMetadata(fileId, {
      videoProcessed: true,
      processingStatus: 'completed'
    });
  },
  
  /**
   * Update file metadata in the database
   */
  async updateFileMetadata(fileId: string, metadataUpdates: Record<string, any>): Promise<void> {
    try {
      // First get current metadata
      const { data, error } = await supabase
        .from('files')
        .select('metadata')
        .eq('id', fileId)
        .single();
        
      if (error) {
        throw new Error(`Error fetching file metadata: ${error.message}`);
      }
      
      // Merge current metadata with updates
      const currentMetadata = data?.metadata || {};
      const updatedMetadata = {
        ...currentMetadata,
        ...metadataUpdates
      };
      
      // Update the file record
      const { error: updateError } = await supabase
        .from('files')
        .update({ metadata: updatedMetadata })
        .eq('id', fileId);
        
      if (updateError) {
        throw new Error(`Error updating file metadata: ${updateError.message}`);
      }
    } catch (error) {
      console.error('Error updating file metadata:', error);
      throw error;
    }
  },
  
  /**
   * Update file processing status
   */
  async updateFileProcessingStatus(
    fileId: string, 
    status: 'pending' | 'processing' | 'completed' | 'failed',
    additionalMetadata: Record<string, any> = {}
  ): Promise<void> {
    await this.updateFileMetadata(fileId, {
      processingStatus: status,
      processingTimestamp: Date.now(),
      ...additionalMetadata
    });
  },
  
  /**
   * Convert file to base64 for API processing
   */
  async fileToBase64(file: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = (error) => reject(error);
    });
  },
  
  /**
   * Get file processing status
   */
  async getFileProcessingStatus(fileId: string): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('files')
        .select('metadata')
        .eq('id', fileId)
        .single();
        
      if (error) {
        throw error;
      }
      
      return data?.metadata?.processingStatus || 'unknown';
    } catch (error) {
      console.error('Error getting file processing status:', error);
      return 'unknown';
    }
  }
};

export default fileProcessingService; 