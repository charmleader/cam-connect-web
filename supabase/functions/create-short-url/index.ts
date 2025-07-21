import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

function generateShortCode(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function isValidUrl(string: string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { 
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { original_url } = await req.json()

    if (!original_url || !isValidUrl(original_url)) {
      return new Response(JSON.stringify({ error: 'Invalid URL provided' }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check if URL already exists
    const { data: existingUrl } = await supabase
      .from('short_links')
      .select('short_code')
      .eq('original_url', original_url)
      .maybeSingle()

    if (existingUrl) {
      const shortUrl = `https://cam-connect-web.lovable.app/s/${existingUrl.short_code}`
      return new Response(JSON.stringify({ 
        short_url: shortUrl,
        short_code: existingUrl.short_code,
        original_url: original_url,
        existing: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Generate unique short_code
    let short_code = ''
    let exists = true
    let attempts = 0
    const maxAttempts = 10

    while (exists && attempts < maxAttempts) {
      short_code = generateShortCode()
      const { data } = await supabase
        .from('short_links')
        .select('id')
        .eq('short_code', short_code)
        .maybeSingle()
      exists = !!data
      attempts++
    }

    if (attempts >= maxAttempts) {
      return new Response(JSON.stringify({ error: 'Failed to generate unique short code' }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { data, error } = await supabase
      .from('short_links')
      .insert([{ original_url, short_code }])
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return new Response(JSON.stringify({ error: 'Failed to create short URL' }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const shortUrl = `https://cam-connect-web.lovable.app/s/${data.short_code}`

    return new Response(JSON.stringify({ 
      short_url: shortUrl,
      short_code: data.short_code,
      original_url: data.original_url,
      created_at: data.created_at
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (err) {
    console.error('Unexpected error:', err)
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})