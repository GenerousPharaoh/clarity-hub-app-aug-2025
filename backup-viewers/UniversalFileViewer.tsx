import { FileRecord } from '../hooks/useProjectFiles';
import PDFViewer from './viewers/PDFViewer';
import ImageViewer from './viewers/ImageViewer';
import DocumentViewer from './viewers/DocumentViewer';
import VideoViewer from './viewers/VideoViewer';
import AudioViewer from './viewers/AudioViewer';
import CodeViewer from './viewers/CodeViewer';
import SpreadsheetViewer from './viewers/SpreadsheetViewer';
import { supabase } from '../lib/supabaseClient';
import { publicUrl } from '../utils/publicUrl';
import { useState, useEffect } from 'react';

const UniversalFileViewer: React.FC<{ file: FileRecord | null }> = ({ file }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const getFile = async () => {
      setLoading(true);
      setError(null);
      
      if (!file) {
        setFileUrl(null);
        setLoading(false);
        return;
      }
      
      try {
        // Get public URL for file
        const directUrl = publicUrl(`files/${file.storage_path}`);
        console.log(`[UniversalFileViewer] Generated public URL: ${directUrl}`);
        
        // For PDF and document files, fetch as blob and create object URL
        if (['pdf', 'document'].includes(file.file_type)) {
          console.log(`[UniversalFileViewer] Using blob approach for ${file.file_type}`);
          try {
            const response = await fetch(directUrl);
            if (!response.ok) {
              throw new Error(`Failed to fetch file: ${response.status}`);
            }
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            console.log(`[UniversalFileViewer] Created blob URL from ${blob.size} bytes`);
            setFileUrl(blobUrl);
          } catch (blobError) {
            console.error(`[UniversalFileViewer] Blob fetch failed, using direct URL:`, blobError);
            setFileUrl(directUrl);
          }
        } else {
          // For other file types, direct URL is fine
          setFileUrl(directUrl);
        }
        
        // Check if file needs processing based on type
        const needsProcessing = ['pdf', 'document', 'spreadsheet'].includes(file.file_type);
        
        if (needsProcessing && file.metadata?.processingStatus === 'pending') {
          setProcessing(true);
          
          // Call analyze-file function to process the file
          // This would typically be done by a server-side trigger
          // But here we'll simulate it for demo purposes
          try {
            await supabase.functions.invoke('analyze-file', {
              body: { fileId: file.id }
            });
          } catch (processingError) {
            console.error('Error processing file:', processingError);
            // Continue showing the file even if processing fails
          } finally {
            setProcessing(false);
          }
        }
      } catch (error) {
        console.error('Error fetching file URL:', error);
        setError('Error loading file. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    getFile();
    
    // Clean up any blob URLs on unmount
    return () => {
      if (fileUrl && fileUrl.startsWith('blob:')) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [file]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!file) {
    return <div>No file selected</div>;
  }

  return (
    <div>
      {/* Render your file viewer component here */}
    </div>
  );
};

export default UniversalFileViewer; 