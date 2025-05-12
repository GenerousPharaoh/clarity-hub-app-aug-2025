import { supabase } from '../lib/supabaseClient';

/**
 * Call a Supabase Edge Function with the specified payload
 * @param fn The function name to call
 * @param payload The payload to send to the function
 * @returns The function's response as JSON
 */
export async function callEdge(fn: string, payload: unknown) {
  // Get current session
  const { data: { session } } = await supabase.auth.getSession();
  
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${fn}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token ?? ""}`,
      },
      body: JSON.stringify(payload),
    },
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Edge function '${fn}' failed: ${errorText}`);
  }
  
  return res.json();
}

export default {
  callEdge
}; 