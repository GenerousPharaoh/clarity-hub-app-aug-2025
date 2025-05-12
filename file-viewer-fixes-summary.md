# File Viewer Fixes

## Problems Fixed

1. **PDF Rendering in iframes**
   - Issue: S3 storage returns `x-frame-options: DENY` which prevents PDFs from being embedded in iframes
   - Solution: Created a PDFViewer component that uses fetch + blob URL creation to avoid the frame restrictions

2. **Storage Bucket Initialization**
   - Issue: Browser-side code attempting admin operations (creating storage buckets) with anonymous key
   - Solution: Modified `storageInit.ts` to skip bucket operations in browser context

3. **Supabase Client Singleton**
   - Issue: Multiple instances being created during HMR/rendering cycles
   - Solution: Implemented true singleton pattern with global reference preservation

4. **Public URL Generation**
   - Issue: Signed URLs causing S3 redirects with restrictive headers
   - Solution: Created public deterministic URLs that bypass signing and redirects

5. **PDF Loading State**
   - Issue: Loading state not being cleared properly when PDF renders
   - Solution: Improved event handling in FileViewer and PDFViewer components

## Implementation Details

### PDFViewer Component

The core fix is using fetch + blob URL pattern:

```tsx
// Fetch the PDF and create a blob URL
useEffect(() => {
  let revoke: string | null = null;
  
  (async () => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      revoke = URL.createObjectURL(blob);
      setBlobUrl(revoke);
      onLoad?.(); // Notify parent component loading is complete
    } catch (err) {
      setError(err);
      onError?.(err);
    }
  })();
  
  return () => {
    if (revoke) URL.revokeObjectURL(revoke);
  };
}, [url]);

// Render the PDF in an iframe using the blob URL
return (
  <iframe
    src={blobUrl}
    title={fileName ?? "pdf"}
    style={{ width: "100%", height: "100%", border: "none" }}
  />
);
```

This approach avoids the x-frame-options restrictions because:
1. The blob URL is same-origin (blob://)
2. We completely bypass the S3 headers/redirects
3. The browser's built-in PDF viewer renders the content directly

### Public URL Generation

Changed URL generation from signed URLs to public direct URLs:

```ts
export const getPublicUrl = (bucket: string, path: string): string => {
  // Extract Supabase project reference from URL
  const ref = supabase.supabaseUrl.match(/https:\/\/(.*?)\.supabase\.co/)?.[1];
  
  // Create direct public URL (no signing, no redirects)
  return `https://${ref}.supabase.co/storage/v1/object/public/${bucket}/${path}`;
};
```

### Storage Bucket Initialization

Modified to skip admin operations in browser context:

```ts
export const initStorageBuckets = async () => {
  // Skip bucket creation in browser environment
  if (typeof window !== 'undefined') {
    console.log('Running in browser, skipping storage bucket initialization');
    return;
  }
  
  // Server-side code continues here...
}
```

### Supabase Client Singleton

Implemented true singleton pattern:

```ts
declare global {
  var __supabase__: ReturnType<typeof createClient<Database>> | undefined;
}

const supabase = 
  globalThis.__supabase__ ?? 
  createClient<Database>(url, key, {
    auth: { persistSession: true, autoRefreshToken: true },
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__supabase__ = supabase;
}
```

## Additional Improvements

1. Added retry functionality to the PDF viewer for resilience
2. Better error feedback for file loading issues
3. Fixed event propagation to ensure parent components know when loading is complete

These fixes together solve the rendering issues by addressing both the direct causes (x-frame-options) and underlying architectural issues (browser-side admin operations). 