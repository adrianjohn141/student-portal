'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirm_password') as string
  const fullName = formData.get('full_name') as string

  if (password !== confirmPassword) {
    return redirect('/signup?message=Password not match')
  }

  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })

  if (error) {
    if (error.code === 'user_already_exists') {
      return redirect('/signup?message=User Already Exist')
    }
    if (error.code === 'over_email_send_rate_limit') {
      return redirect('/signup?message=Too many attempts. Please wait a minute and try again.')
    }
    console.error(error)
    return redirect('/signup?message=Could not sign up user')
  }

  revalidatePath('/', 'layout')
  redirect('/login?message=Account created! Please check your email to confirm your account.')
}
