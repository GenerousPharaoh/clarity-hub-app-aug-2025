import axios from 'axios';

const BASE_URL =
  import.meta.env.VITE_AI_API_BASE?.replace(/\/+$/, '') || '/api/ai';

/**  
 * POST /analyze — returns structured analysis from the LLM backend.  
 */
export async function analyzeWritingContext(
  text: string,
  projectId?: string,
): Promise<any> {
  const { data } = await axios.post(`${BASE_URL}/analyze`, {
    text,
    projectId,
  });
  return data;
}

export default { analyzeWritingContext }; 