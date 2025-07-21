import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

serve(async (req: Request) => {
  try {
    const url = new URL(req.url)
    const shortCode = url.pathname.split('/').pop()

    if (!shortCode) {
      return new Response('Short code not provided', { status: 400 })
    }

    // Find the original URL
    const { data: linkData, error } = await supabase
      .from('short_links')
      .select('original_url, click_count')
      .eq('short_code', shortCode)
      .single()

    if (error || !linkData) {
      return new Response('Short URL not found', { status: 404 })
    }

    // Update click count
    await supabase
      .from('short_links')
      .update({ click_count: linkData.click_count + 1 })
      .eq('short_code', shortCode)

    // Redirect to original URL
    return new Response(null, {
      status: 302,
      headers: {
        'Location': linkData.original_url,
      },
    })

  } catch (err) {
    console.error('Redirect error:', err)
    return new Response('Internal Server Error', { status: 500 })
  }
})