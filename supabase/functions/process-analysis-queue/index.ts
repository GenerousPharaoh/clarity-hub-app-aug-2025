import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getSupabaseClient } from '../utils/database.ts';

// Process files in the analysis queue
async function processQueue() {
  const supabase = getSupabaseClient();
  
  // Get pending files from queue (limit to 5 at a time)
  const { data: pendingItems, error: queueError } = await supabase
    .from('file_analysis_queue')
    .select('id, file_id, project_id')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(5);
    
  if (queueError) {
    throw new Error(`Error fetching queue: ${queueError.message}`);
  }
  
  if (!pendingItems || pendingItems.length === 0) {
    return { processed: 0, message: 'No pending items in queue' };
  }
  
  const results = [];
  
  // Process each pending item
  for (const item of pendingItems) {
    try {
      // Update status to processing
      await supabase
        .from('file_analysis_queue')
        .update({ status: 'processing' })
        .eq('id', item.id);
      
      // Call analyze-file function
      const { data, error } = await supabase.functions.invoke('analyze-file', {
        body: { fileId: item.file_id }
      });
      
      if (error) {
        throw new Error(`Analysis failed: ${error.message}`);
      }
      
      // Update with success status
      await supabase
        .from('file_analysis_queue')
        .update({ 
          status: 'completed',
          processed_at: new Date().toISOString()
        })
        .eq('id', item.id);
      
      results.push({
        id: item.id,
        file_id: item.file_id,
        status: 'completed'
      });
    } catch (error) {
      console.error(`Error processing item ${item.id}:`, error);
      
      // Update with error status
      await supabase
        .from('file_analysis_queue')
        .update({ 
          status: 'error',
          processed_at: new Date().toISOString()
        })
        .eq('id', item.id);
      
      results.push({
        id: item.id,
        file_id: item.file_id,
        status: 'error',
        error: error.message
      });
    }
  }
  
  return {
    processed: results.length,
    results
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    const result = await processQueue();
    
    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in process-analysis-queue:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process analysis queue',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});