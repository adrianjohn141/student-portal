'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function logout() {
  const supabase = await createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error(error)
    redirect('/error') // Or handle the error as you see fit
  }

  revalidatePath('/', 'layout')
  redirect('/login')
}