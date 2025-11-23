'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email.toLowerCase().endsWith('psu.edu.ph')) {
    return redirect('/login?message=Only psu.edu.ph emails are allowed')
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error(error)
    if (error.message.includes('Invalid login credentials')) {
      return redirect('/login?message=Invalid email or password')
    }
    return redirect('/login?message=Could not authenticate user')
  }

  revalidatePath('/home', 'layout')
  redirect('/home')
}
