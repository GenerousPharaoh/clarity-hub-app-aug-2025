import { supabase } from '@/lib/supabaseClient';

// Base Supabase project URL for direct public path construction
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://swtkpfpyjjkkemmvkhmz.supabase.co';

/**
 * Enhanced version of getFileUrl that provides detailed logging and fallbacks
 * @param path - Storage path to the file
 * @param options - Options for creating URL
 * @returns Object with url and error properties
 */
export const getFileUrl = async (
  path: string,
  options: {
    download?: boolean;
    transform?: any;
  } = {}
): Promise<{ url: string; error?: any }> => {
  console.group(`[storageServiceDebug] Getting URL for: ${path}`);
  
  try {
    // APPROACH 1: Direct public URL (most reliable)
    try {
      const projectId = supabaseUrl.match(/\/\/([^.]+)/)?.[1] || 'swtkpfpyjjkkemmvkhmz';
      const directUrl = `https://${projectId}.supabase.co/storage/v1/object/public/files/${path}`;
      
      console.log(`[storageServiceDebug] Trying direct URL: ${directUrl}`);
      
      // Test if URL is accessible
      const headResponse = await fetch(directUrl, { method: 'HEAD' });
      
      if (headResponse.ok) {
        console.log(`[storageServiceDebug] ✅ Direct URL accessible (${headResponse.status})`);
        console.groupEnd();
        return { url: directUrl };
      } else {
        console.log(`[storageServiceDebug] ❌ Direct URL failed (${headResponse.status})`);
      }
    } catch (directError) {
      console.log(`[storageServiceDebug] ❌ Direct URL error:`, directError);
    }

    // APPROACH 2: Signed URL
    try {
      console.log(`[storageServiceDebug] Trying signed URL for: ${path}`);
      
      const { data: signedData, error: signedError } = await supabase.storage
        .from('files')
        .createSignedUrl(path, 3600, options);
      
      if (signedData?.signedUrl) {
        console.log(`[storageServiceDebug] ✅ Signed URL created successfully`);
        console.groupEnd();
        return { url: signedData.signedUrl };
      } else {
        console.log(`[storageServiceDebug] ❌ Signed URL failed:`, signedError);
      }
    } catch (signedError) {
      console.log(`[storageServiceDebug] ❌ Signed URL error:`, signedError);
    }

    // APPROACH 3: Public URL
    try {
      console.log(`[storageServiceDebug] Trying getPublicUrl for: ${path}`);
      
      const { data: publicData } = supabase.storage
        .from('files')
        .getPublicUrl(path, options);
      
      if (publicData?.publicUrl) {
        // Test if URL is accessible
        try {
          const headResponse = await fetch(publicData.publicUrl, { method: 'HEAD' });
          
          if (headResponse.ok) {
            console.log(`[storageServiceDebug] ✅ Public URL accessible (${headResponse.status})`);
            console.groupEnd();
            return { url: publicData.publicUrl };
          } else {
            console.log(`[storageServiceDebug] ❌ Public URL failed (${headResponse.status})`);
          }
        } catch (fetchError) {
          console.log(`[storageServiceDebug] ❌ Public URL fetch error:`, fetchError);
        }
      } else {
        console.log(`[storageServiceDebug] ❌ Public URL not returned`);
      }
    } catch (publicError) {
      console.log(`[storageServiceDebug] ❌ Public URL error:`, publicError);
    }

    // APPROACH 4: Download URL with workaround
    try {
      console.log(`[storageServiceDebug] Trying download URL for: ${path}`);
      
      const { data: downloadData, error: downloadError } = await supabase.storage
        .from('files')
        .download(path);
      
      if (downloadData) {
        // Create an object URL from the blob
        const objectUrl = URL.createObjectURL(downloadData);
        console.log(`[storageServiceDebug] ✅ Download URL created successfully`);
        console.groupEnd();
        return { url: objectUrl };
      } else {
        console.log(`[storageServiceDebug] ❌ Download URL failed:`, downloadError);
      }
    } catch (downloadError) {
      console.log(`[storageServiceDebug] ❌ Download URL error:`, downloadError);
    }

    // All approaches failed - construct a new direct URL as last resort
    const projectId = supabaseUrl.match(/\/\/([^.]+)/)?.[1] || 'swtkpfpyjjkkemmvkhmz';
    const directUrl = `https://${projectId}.supabase.co/storage/v1/object/public/files/${path}`;
    
    console.log(`[storageServiceDebug] ⚠️ All approaches failed, returning direct URL as fallback: ${directUrl}`);
    console.groupEnd();
    
    return { 
      url: directUrl,
      error: "All URL resolution methods failed, using direct URL as fallback"
    };
  } catch (error) {
    console.error(`[storageServiceDebug] ❌ Critical error in getFileUrl:`, error);
    console.groupEnd();
    return { 
      url: '', 
      error 
    };
  }
};

// Export the supabase client for direct use
export { supabase };

// Export a default object with all the functions
export default {
  getFileUrl,
  supabase
}; 