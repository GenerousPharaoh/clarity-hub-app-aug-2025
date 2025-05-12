import { createClient } from '@supabase/supabase-js';

// Create a Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://swtkpfpyjjkkemmvkhmz.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3dGtwZnB5ampra2VtbXZraG16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzMDM5NTIsImV4cCI6MjA2MDg3OTk1Mn0.8herIfBAFOFUXro03pQxiS4Htnljavfncz-FvPj3sGw';

// Initialize the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Check if a user is an admin
export const isAdminUser = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return false;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    
    if (error || !data) return false;
    
    return data.is_admin === true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

// Export the Supabase client as default export
export const supabaseClient = supabase;

export default supabase; 