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

  const emailRegex = /^25ln\d{4}_ms@psu\.edu\.ph$/
  if (!emailRegex.test(email)) {
    return redirect('/signup?message=Invalid email format')
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
    console.error(error)
    if (error.code === 'user_already_exists') {
      return redirect('/signup?message=User Already Exist')
    }
    return redirect('/signup?message=Could not sign up user')
  }

  if (user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({ id: user.id, full_name: fullName })
    if (profileError) {
      console.error(profileError)
      return redirect('/signup?message=Could not create user profile')
    }
  }

  revalidatePath('/', 'layout')
  redirect('/login?message=Account created successfully! Please log in.')
}
