'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

// --- ENROLL ACTION ---
const EnrollSchema = z.object({
  course_id: z.coerce.number().int().positive('Invalid Course ID'),
})
export async function enrollCourse(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const validatedFields = EnrollSchema.safeParse({ course_id: formData.get('course_id') })
  if (!validatedFields.success) {
    console.error('Validation Error:', validatedFields.error.flatten().fieldErrors)
    return redirect('/?message=Invalid course ID provided.')
  }
  const { course_id } = validatedFields.data

  // --- 1. Enroll the student ---
  const { error: enrollError } = await supabase.from('student_courses').insert({
    student_id: user.id,
    course_id: course_id,
  })
  if (enrollError) {
    console.error('Error enrolling in course:', enrollError)
    if (enrollError.code === '23505') {
       return redirect('/?message=Already enrolled in this course.')
    }
    return redirect('/?message=Error enrolling in course.')
  }

  // Note: Previous logic to fetch course details and insert events into the 'events' table
  // has been removed. We now rely on dynamic event generation in the schedule fetch logic.

  // --- Final: Revalidate and Redirect ---
  revalidatePath('/')
  revalidatePath('/schedule')
  return redirect('/?message=Successfully enrolled!')
}


// --- UNENROLL ACTION ---
const UnenrollSchema = z.object({
  course_id: z.coerce.number().int().positive('Invalid Course ID'),
})
export async function unenrollCourse(formData: FormData) {
   const supabase = await createClient()
   const { data: { user } } = await supabase.auth.getUser()
   if (!user) return redirect('/login')

   const validatedFields = UnenrollSchema.safeParse({ course_id: formData.get('course_id') })
   if (!validatedFields.success) {
      console.error('Validation Error:', validatedFields.error.flatten().fieldErrors)
      return redirect('/?message=Invalid course ID provided.')
   }
   const { course_id } = validatedFields.data

   // --- 1. Unenroll student ---
   const { error: unenrollError } = await supabase
    .from('student_courses')
    .delete()
    .eq('student_id', user.id)
    .eq('course_id', course_id)
   if (unenrollError) {
      console.error('Error unenrolling from course:', unenrollError)
      return redirect('/?message=Error unenrolling from course.')
   }

   // Note: Previous logic to delete events from the 'events' table has been removed.
   // Since we don't insert them anymore, we don't need to delete them (and legacy events
   // can be cleaned up separately if needed, or ignored as they are duplicate/static).

   // --- Final: Revalidate and Redirect ---
   revalidatePath('/')
   revalidatePath('/schedule')
   return redirect('/?message=Successfully unenrolled!')
}
