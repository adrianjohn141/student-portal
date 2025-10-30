'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

// Define the schema for the profile update
const UpdateProfileSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
})

export type FormState = {
  message: string
  errors?: {
    full_name?: string[]
  }
}

export async function updateprofile(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return redirect('/login')
  }

  const validatedFields = UpdateProfileSchema.safeParse({
    full_name: formData.get('full_name'),
  })

  if (!validatedFields.success) {
    return {
      message: 'Please fix the errors below.',
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { full_name } = validatedFields.data

  const { error } = await supabase
    .from('profiles')
    .upsert({ id: user.id, full_name: full_name })
    .select()

  if (error) {
    console.error('Error updating profile:', error)
    return {
      message: 'Error updating profile.',
    }
  }

  revalidatePath('/')
  revalidatePath('/profile')

  return {
    message: 'Profile updated successfully!',
  }
}
