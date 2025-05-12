import axios from 'axios';

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

export default { analyzeWritingContext }; 