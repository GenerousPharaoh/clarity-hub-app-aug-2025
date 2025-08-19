/**
 * Creates a direct public URL for a file in Supabase Storage
 * 
 * This uses a deterministic approach that avoids signed URLs and redirects
 * which can cause issues with iframe embedding. The generated URL works
 * across any network environment.
 * 
 * @param key - Storage path (can include bucket as prefix or be passed separately)
 * @param bucket - Storage bucket (optional if included in key)
 * @returns Direct public URL to the file
 */
export const publicUrl = (key: string, bucket?: string): string => {
  // Get Supabase project URL from environment
  // Strip any trailing slashes to avoid double slashes in the final URL
  const base = (import.meta.env.VITE_SUPABASE_URL || 'https://swtkpfpyjjkkemmvkhmz.supabase.co')
    .replace(/\/+$/, '');
  
  // Parse bucket from key if not provided separately
  let storagePath: string;
  let storageBucket: string;
  
  if (bucket) {
    storageBucket = bucket;
    storagePath = key;
  } else if (key.includes('/')) {
    // Try to extract bucket from path (e.g. "files/example.pdf")
    const parts = key.split('/');
    storageBucket = parts[0];
    storagePath = parts.slice(1).join('/');
  } else {
    // Default to files bucket if no slash in path
    storageBucket = 'files';
    storagePath = key;
  }
  
  // Clean up any leading/trailing slashes
  storageBucket = storageBucket.replace(/^\/+|\/+$/g, '');
  storagePath = storagePath.replace(/^\/+|\/+$/g, '');
  
  // Construct direct public URL with properly encoded path components
  // Use encodeURIComponent for each path segment to handle special characters
  const encodedPath = storagePath.split('/').map(segment => encodeURIComponent(segment)).join('/');
  
  // Log the URL generation for debugging
  const url = `${base}/storage/v1/object/public/${storageBucket}/${encodedPath}`;
  console.log(`[publicUrl] Generated URL: ${url}`);
  
  return url;
};

/**
 * Creates a direct download URL for a file in Supabase Storage
 * 
 * This is similar to publicUrl but includes the download parameter
 * to force the browser to download the file instead of displaying it.
 * 
 * @param key - Storage path (can include bucket as prefix or be passed separately)
 * @param bucket - Storage bucket (optional if included in key)
 * @returns Direct download URL to the file
 */
export const downloadUrl = (key: string, bucket?: string): string => {
  const url = publicUrl(key, bucket);
  return `${url}?download`; 
};

export default publicUrl; 