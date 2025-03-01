
-- Create storage bucket for issue images if it doesn't exist
INSERT INTO storage.buckets (id, name, public) VALUES ('issue-images', 'issue-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Enable real-time for issues table
ALTER TABLE public.issues REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.issues;

-- Enable real-time for profiles table
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
