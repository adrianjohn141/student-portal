'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

// Schema to validate the passwords
const PasswordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required.'),
  new_password: z.string().min(6, 'New password must be at least 6 characters long.'),
})

export async function changePassword(formData: FormData) {
  const supabase = await createClient()

  // 1. Get the authenticated user's email
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return redirect('/login')
  }

  // 2. Validate the form data
  const validatedFields = PasswordSchema.safeParse({
    current_password: formData.get('current_password'),
    new_password: formData.get('new_password'),
  })

  if (!validatedFields.success) {
    const errorMessage = validatedFields.error.flatten().fieldErrors.new_password?.[0] 
      || validatedFields.error.flatten().fieldErrors.current_password?.[0] 
      || 'Invalid data.'
    return redirect(`/settings?message=Error: ${errorMessage}`)
  }

  const { current_password, new_password } = validatedFields.data

  // 3. Check if the new password is the same as the current one
  if (current_password === new_password) {
    return redirect('/settings?message=Error: New password cannot be the same as the current password.')
  }

  // 4. Verify the current password by trying to sign in with it
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: current_password,
  })

  if (signInError) {
    console.error('Error verifying current password:', signInError)
    return redirect('/settings?message=Error: Incorrect current password.')
  }

  // 5. If verification is successful, update the user's password
  const { error: updateError } = await supabase.auth.updateUser({ 
    password: new_password 
  })

  if (updateError) {
    console.error('Error changing password:', updateError)
    return redirect('/settings?message=Error: Could not change password.')
  }

  // 6. Revalidate and Redirect
  revalidatePath('/settings')
  return redirect('/settings?message=Password updated successfully!')
}
