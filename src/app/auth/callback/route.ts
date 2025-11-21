import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/home'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Check if email is from the correct domain
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user?.email && !user.email.endsWith('psu.edu.ph')) {
        // Sign out if not allowed
        await supabase.auth.signOut()
        return NextResponse.redirect(`${origin}/login?message=Error: Only psu.edu.ph emails are allowed.`)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?message=Could not authenticate user`)
}
