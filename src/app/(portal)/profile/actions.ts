'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function updateprofile(formData: FormData) {
  const supabase = await createClient()

  // Check if the user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return redirect('/login')
  }

  const full_name = formData.get('full_name') as string

  // Upsert the user's profile to create or update the row
  // Your 'upsert' logic is correct!
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: user.id, full_name: full_name })

    .select() 

  if (error) {
    console.error('Error updating profile:', error)
    return redirect('/profile?message=Error updating profile')
  }

  // --- FIX ---
  // Revalidate the data for ALL pages that use the sidebar
  revalidatePath('/')
  revalidatePath('/profile')
  // --- END FIX ---

  return redirect('/profile?message=profile updated successfully!')
}
