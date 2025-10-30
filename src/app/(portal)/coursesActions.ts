'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
// Import date-fns functions
import { startOfWeek, endOfWeek, addDays, getDay, parse, formatISO, setHours, setMinutes, setSeconds } from 'date-fns';

// Helper function (no changes needed)
function combineDateAndTime(date: Date, timeString: string): string {
    const [hours, minutes, seconds] = timeString.split(':').map(Number);
    let newDate = new Date(date);
    newDate.setHours(hours, minutes, seconds, 0);
    return newDate.toISOString();
}

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

  // --- 1. Enroll the student (no changes) ---
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

  // --- 2. Fetch course details (no changes) ---
  const { data: courseDetails, error: courseError } = await supabase
    .from('courses')
    .select('course_name, class_start_time, class_end_time, meets_monday, meets_tuesday, meets_wednesday, meets_thursday, meets_friday, meets_saturday, meets_sunday')
    .eq('id', course_id)
    .single();
  if (courseError || !courseDetails || !courseDetails.class_start_time || !courseDetails.class_end_time) {
      console.error('Error fetching course details or missing times:', courseError);
      revalidatePath('/');
      revalidatePath('/schedule');
      return redirect('/?message=Enrolled, but failed to add to schedule (missing course data).');
  }

  // --- 3. Calculate current & next week's dates and generate events ---
  const now = new Date();
  const currentWeekStart = startOfWeek(now, { weekStartsOn: 0 }); // Sunday
  const eventsToInsert = [];
  const meetingDays = [
      courseDetails.meets_sunday, courseDetails.meets_monday, courseDetails.meets_tuesday,
      courseDetails.meets_wednesday, courseDetails.meets_thursday, courseDetails.meets_friday,
      courseDetails.meets_saturday
  ];

  // --- MODIFIED: Loop for 14 days (current + next week) ---
  for (let i = 0; i < 14; i++) {
      const currentDayDate = addDays(currentWeekStart, i);
      const dayOfWeek = getDay(currentDayDate); // 0 for Sunday...

      if (meetingDays[dayOfWeek]) { // Check if the course meets on this day
          try {
              const eventStartTimeISO = combineDateAndTime(currentDayDate, courseDetails.class_start_time);
              const eventEndTimeISO = combineDateAndTime(currentDayDate, courseDetails.class_end_time);

              eventsToInsert.push({
                  user_id: user.id,
                  course_id: course_id,
                  title: courseDetails.course_name || `Course ${course_id}`,
                  start_time: eventStartTimeISO,
                  end_time: eventEndTimeISO,
              });
          } catch (e) {
              console.error(`Error processing date/time for course ${course_id} on day ${i}:`, e);
          }
      }
  }

  // --- 4. Insert generated events (no changes) ---
  if (eventsToInsert.length > 0) {
      console.log('Inserting events for 2 weeks:', eventsToInsert);
      const { error: eventInsertError } = await supabase.from('events').insert(eventsToInsert);
      if (eventInsertError) {
          console.error('Error inserting course events:', eventInsertError);
          revalidatePath('/');
          revalidatePath('/schedule');
          return redirect('/?message=Enrolled, but failed to add some schedule times.');
      }
  } else {
      console.log('No meeting days found for course', course_id, 'in the current/next week.');
  }

  // --- 5. Revalidate and Redirect (no changes) ---
  revalidatePath('/')
  revalidatePath('/schedule')
  return redirect('/?message=Successfully enrolled and added to schedule!')
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

   // --- 1. Unenroll student (no changes) ---
   const { error: unenrollError } = await supabase
    .from('student_courses')
    .delete()
    .eq('student_id', user.id)
    .eq('course_id', course_id)
   if (unenrollError) {
      console.error('Error unenrolling from course:', unenrollError)
      return redirect('/?message=Error unenrolling from course.')
   }

   // --- 2. Calculate current & next week range for deletion ---
   const now = new Date();
   const currentWeekStart = startOfWeek(now, { weekStartsOn: 0 }); // Sunday of current week
   // End of the NEXT week (add 1 week = 7 days, then find end of that week)
   const nextWeekEnd = endOfWeek(addDays(currentWeekStart, 7), { weekStartsOn: 0 });

   // --- 3. Delete corresponding events *for current and next week* ---
   console.log(`Deleting events for course ${course_id} between ${formatISO(currentWeekStart)} and ${formatISO(nextWeekEnd)}`);
   const { error: eventDeleteError } = await supabase
       .from('events')
       .delete()
       .eq('user_id', user.id)
       .eq('course_id', course_id)
       .gte('start_time', formatISO(currentWeekStart)) // Event starts ON or AFTER current week start
       .lte('start_time', formatISO(nextWeekEnd));   // Event starts ON or BEFORE next week end

   if (eventDeleteError) {
       console.error('Error deleting course events from schedule:', eventDeleteError);
   }

   // --- 4. Revalidate and Redirect (no changes) ---
   revalidatePath('/')
   revalidatePath('/schedule')
   return redirect('/?message=Successfully unenrolled!')
}