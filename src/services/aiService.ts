import axios from 'axios';
import { supabase } from '../lib/supabase';

// Get the configured base URL or use default edge function path
const BASE_URL = import.meta.env.VITE_AI_API_BASE?.replace(/\/+$/, '') || 
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

/**  
 * POST /analyze-writing-context — returns structured analysis from the Gemini LLM.
 */
export async function analyzeWritingContext(
  text: string,
  projectId?: string,
): Promise<any> {
  try {
    console.log('Sending text for analysis, length:', text.length);
    if (projectId) {
      console.log('For project:', projectId);
    }
    
    const endpoint = `${BASE_URL}/analyze-writing-context`;
    
    const { data } = await axios.post(endpoint, {
      text,
      projectId,
    }, {
      headers: {
        'Content-Type': 'application/json',
        // Include anon key for Supabase Edge Functions
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      timeout: 30000, // 30 second timeout for LLM processing
    });
    
    console.log('Analysis completed successfully');
    return data;
  } catch (error) {
    console.error('Error analyzing text:', error);
    // Re-throw with more context
    if (axios.isAxiosError(error)) {
      throw new Error(`Analysis failed: ${error.response?.status} ${error.response?.statusText || error.message}`);
    }
    throw new Error(`Analysis failed: ${error.message}`);
  }
}

/**
 * Analyze a file using Google Gemini through Edge Functions
 * @param fileId The ID of the file to analyze
 * @returns Analysis result from Gemini
 */
export async function analyzeFile(fileId: string): Promise<any> {
  try {
    console.log(`Analyzing file ${fileId} with AI`);
    
    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke('analyze-file', {
      body: { fileId }
    });
    
    if (error) {
      throw new Error(`Analysis failed: ${error.message}`);
    }
    
    console.log('File analysis completed successfully');
    
    // Update file metadata with analysis results
    if (data?.analysis) {
      // Update file metadata in database
      const { error: updateError } = await supabase
        .from('files')
        .update({
          metadata: {
            documentAnalysis: data.analysis,
            processingStatus: 'completed',
            processedAt: new Date().toISOString()
          }
        })
        .eq('id', fileId);
      
      if (updateError) {
        console.error('Error updating file metadata:', updateError);
      }
    }
    
    return data;
  } catch (error) {
    console.error('Error analyzing file:', error);
    throw error;
  }
}

/**
 * Generate tag suggestions for a document using AI
 * @param text The document text to analyze
 * @returns List of tag suggestions
 */
export async function generateTagSuggestions(text: string): Promise<string[]> {
  try {
    // Truncate text if it's too long
    const truncatedText = text.length > 5000 ? text.substring(0, 5000) + '...' : text;
    
    // Call analyze-writing-context
    const result = await analyzeWritingContext(truncatedText);
    
    if (result?.suggestedTopics) {
      return result.suggestedTopics;
    }
    
    return [];
  } catch (error) {
    console.error('Error generating tag suggestions:', error);
    return [];
  }
}

export default { analyzeWritingContext, analyzeFile, generateTagSuggestions }; 