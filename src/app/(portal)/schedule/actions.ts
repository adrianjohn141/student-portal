'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { startOfWeek, addDays, getDay, parse, set, formatISO } from 'date-fns'

// --- CREATE EVENT ---
export async function createEvent(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return redirect('/login')
  }

  const title = formData.get('title') as string
  const start_time = formData.get('start_time') as string
  const end_time = formData.get('end_time') as string

  // Simple validation
  if (!title || !start_time || !end_time) {
    return { error: 'Missing form data' }
  }

  const { error } = await supabase.from('events').insert({
    user_id: user.id,
    title: title,
    start_time: start_time,
    end_time: end_time,
  })

  if (error) {
    console.error('Error creating event:', error)
    return { error: 'Could not create event.' }
  }

  revalidatePath('/schedule')
  return { success: 'Event created!' }
}

// --- FETCH EVENTS ---
export async function fetchEvents() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return []
  }

  // 1. Fetch Custom Events (from 'events' table)
  const { data: customEvents, error: customError } = await supabase
    .from('events')
    .select('id, title, start_time, end_time')
    .eq('user_id', user.id)

  if (customError) {
    console.error('Error fetching custom events:', customError)
  }

  const formattedCustomEvents = (customEvents || []).map((event) => ({
    ...event,
    id: String(event.id),
    start: new Date(event.start_time),
    end: new Date(event.end_time),
    isCourseEvent: false,
  }))

  // 2. Fetch Enrolled Courses
  const { data: enrolledCourses, error: coursesError } = await supabase
    .from('student_courses')
    .select(`
      course:courses (
        id,
        course_name,
        class_start_time,
        class_end_time,
        meets_monday,
        meets_tuesday,
        meets_wednesday,
        meets_thursday,
        meets_friday,
        meets_saturday,
        meets_sunday
      )
    `)
    .eq('student_id', user.id)

  if (coursesError) {
    console.error('Error fetching enrolled courses:', coursesError)
    // Return just custom events if courses fail
    return formattedCustomEvents
  }

  // 3. Generate Course Events (Dynamic Projection)
  const courseEvents = []
  
  // Define range for generation: Current year +/- 1 year (or just current year context)
  // For simplicity, let's generate for 6 months back and 6 months forward from today.
  const now = new Date()
  const startDate = addDays(now, -180) // 6 months ago
  const endDate = addDays(now, 180)   // 6 months future
  
  // Helper to parse time string "HH:mm" or "HH:mm:ss"
  const parseTime = (timeStr: string, baseDate: Date) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return set(baseDate, { hours, minutes, seconds: 0, milliseconds: 0 });
  }

  for (const item of enrolledCourses) {
    // Type guard / check if course exists
    const course = Array.isArray(item.course) ? item.course[0] : item.course;
    if (!course) continue;

    const meetingDays = [
      course.meets_sunday,
      course.meets_monday,
      course.meets_tuesday,
      course.meets_wednesday,
      course.meets_thursday,
      course.meets_friday,
      course.meets_saturday,
    ]

    // Iterate through dates in the range
    let current = new Date(startDate)
    // Normalize to start of day to avoid drift
    current.setHours(0,0,0,0)

    while (current <= endDate) {
      const dayOfWeek = getDay(current)
      
      if (meetingDays[dayOfWeek]) {
        try {
            const start = parseTime(course.class_start_time, current)
            const end = parseTime(course.class_end_time, current)
            
            // Create a unique ID for this instance
            // Format: course-[id]-[date]
            const instanceId = `course-${course.id}-${formatISO(current, { representation: 'date' })}`

            courseEvents.push({
                id: instanceId,
                title: course.course_name,
                start: start,
                end: end,
                isCourseEvent: true,
                courseId: course.id // Keep reference
            })
        } catch (e) {
            console.error('Error generating event for course', course.id, e)
        }
      }
      // Next day
      current = addDays(current, 1)
    }
  }

  return [...formattedCustomEvents, ...courseEvents]
}

// --- FETCH EVENTS FOR A SPECIFIC DATE ---
export async function fetchEventsForDate(dateString: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return []
  }

  // Use the provided date string to create date objects
  const targetDate = new Date(dateString)
  const startOfDay = new Date(
    targetDate.getFullYear(),
    targetDate.getMonth(),
    targetDate.getDate(),
  ).toISOString()
  const endOfDay = new Date(
    targetDate.getFullYear(),
    targetDate.getMonth(),
    targetDate.getDate() + 1,
  ).toISOString()

  // 1. Fetch Custom Events
  const { data: events, error } = await supabase
    .from('events')
    .select('id, title, start_time, end_time')
    .eq('user_id', user.id)
    .gte('start_time', startOfDay)
    .lt('start_time', endOfDay)
    .order('start_time', { ascending: true })

  if (error) {
    console.error('Error fetching events for date:', error)
  }

  const formattedCustomEvents = (events || []).map((event) => ({
    ...event,
    id: String(event.id),
    start: new Date(event.start_time),
    end: new Date(event.end_time),
    isCourseEvent: false,
  }))

  // 2. Fetch Enrolled Courses
  const { data: enrolledCourses, error: coursesError } = await supabase
    .from('student_courses')
    .select(`
      course:courses (
        id,
        course_name,
        class_start_time,
        class_end_time,
        meets_monday,
        meets_tuesday,
        meets_wednesday,
        meets_thursday,
        meets_friday,
        meets_saturday,
        meets_sunday
      )
    `)
    .eq('student_id', user.id)

  if (coursesError) {
    console.error('Error fetching enrolled courses for date:', coursesError)
    return formattedCustomEvents
  }

  // 3. Generate Course Events for this specific date
  const courseEvents = []
  
  // Helper to parse time string "HH:mm" or "HH:mm:ss"
  const parseTime = (timeStr: string, baseDate: Date) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return set(baseDate, { hours, minutes, seconds: 0, milliseconds: 0 });
  }

  const dayOfWeek = getDay(targetDate)

  for (const item of enrolledCourses) {
    const course = Array.isArray(item.course) ? item.course[0] : item.course;
    if (!course) continue;

    const meetingDays = [
      course.meets_sunday,
      course.meets_monday,
      course.meets_tuesday,
      course.meets_wednesday,
      course.meets_thursday,
      course.meets_friday,
      course.meets_saturday,
    ]

    if (meetingDays[dayOfWeek]) {
      try {
        const start = parseTime(course.class_start_time, targetDate)
        const end = parseTime(course.class_end_time, targetDate)
        
        // Create a unique ID
        const instanceId = `course-${course.id}-${formatISO(targetDate, { representation: 'date' })}`

        courseEvents.push({
            id: instanceId,
            title: course.course_name,
            start: start,
            end: end,
            isCourseEvent: true,
            courseId: course.id
        })
      } catch (e) {
        console.error('Error generating event for course', course.id, e)
      }
    }
  }

  // Combine and sort
  const allEvents = [...formattedCustomEvents, ...courseEvents]
  allEvents.sort((a, b) => a.start.getTime() - b.start.getTime())

  return allEvents
}


// --- UPDATE EVENT ---
const UpdateEventSchema = z.object({
  id: z.string(), // Assuming ID comes from the form or context
  title: z.string().min(1, 'Title is required'),
  start_time: z.string().datetime({ message: 'Invalid start date/time format' }), // Added message
  end_time: z.string().datetime({ message: 'Invalid end date/time format' }),   // Added message
})
export async function updateEvent(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const validatedFields = UpdateEventSchema.safeParse({
    id: formData.get('id') as string,
    title: formData.get('title') as string,
    start_time: formData.get('start_time') as string,
    end_time: formData.get('end_time') as string,
  })

  if (!validatedFields.success) {
    console.error('Validation errors:', validatedFields.error.flatten().fieldErrors)
    // Return specific validation errors if needed
    // return { error: 'Invalid form data.', details: validatedFields.error.flatten().fieldErrors };
    return { error: 'Invalid form data.' }
  }

  const { id, title, start_time, end_time } = validatedFields.data

  const { error } = await supabase
    .from('events')
    .update({
      title: title,
      start_time: start_time,
      end_time: end_time,
    })
    .eq('id', id)
    .eq('user_id', user.id) // IMPORTANT: Ensure user owns the event

  if (error) {
    console.error('Error updating event:', error)
    return { error: 'Could not update event.' }
  }

  revalidatePath('/schedule')
  return { success: 'Event updated!' }
}


// --- DELETE EVENT ---
const DeleteEventSchema = z.object({
  id: z.string().min(1, 'Event ID is required'), // Ensure ID is not empty
})
export async function deleteEvent(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const validatedFields = DeleteEventSchema.safeParse({
    id: formData.get('id') as string,
  })

  if (!validatedFields.success) {
      console.error('Validation errors:', validatedFields.error.flatten().fieldErrors)
      return { error: 'Invalid event ID.' }
  }

  const { id } = validatedFields.data

  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id) // IMPORTANT: Ensure user owns the event

  if (error) {
    console.error('Error deleting event:', error)
    return { error: 'Could not delete event.' }
  }

  revalidatePath('/schedule')
  return { success: 'Event deleted!' }
}
