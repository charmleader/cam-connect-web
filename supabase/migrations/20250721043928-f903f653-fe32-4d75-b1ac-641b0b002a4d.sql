-- Create table for URL shortening
CREATE TABLE public.short_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_url TEXT NOT NULL,
  short_code VARCHAR(10) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID,
  click_count INTEGER DEFAULT 0
);

-- Enable Row Level Security
ALTER TABLE public.short_links ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert short links (anonymous users can create short URLs)
CREATE POLICY "Anyone can create short links" 
ON public.short_links 
FOR INSERT 
WITH CHECK (true);

-- Allow anyone to view short links
CREATE POLICY "Anyone can view short links" 
ON public.short_links 
FOR SELECT 
USING (true);

-- Allow anyone to update click count
CREATE POLICY "Anyone can update click count" 
ON public.short_links 
FOR UPDATE 
USING (true);