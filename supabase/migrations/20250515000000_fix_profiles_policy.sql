-- Fix infinite recursion in profiles policy
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;

-- Create a simpler policy without recursion
CREATE POLICY "Users can view all profiles" 
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Create policies for insert/update/delete
CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Allow system to create profile on signup
CREATE POLICY "System can manage profiles" 
  ON profiles FOR ALL 
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() = id); 