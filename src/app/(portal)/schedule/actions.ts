'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod' // Make sure you run: npm install zod

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
  const { data: { user } } = await supabase.auth.getUser() // Corrected variable name
  if (!user) {
    return [] // Return empty array if no user
  }

  const { data: events, error } = await supabase
    .from('events')
    .select('id, title, start_time, end_time')
    .eq('user_id', user.id)

  if (error) {
    console.error('Error fetching events:', error)
    return []
  }

  // Convert event times to Date objects for the calendar
  return events.map((event) => ({
    ...event,
    id: String(event.id), // Ensure id is a string for calendar
    start: new Date(event.start_time),
    end: new Date(event.end_time),
  }))
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

  const { data: events, error } = await supabase
    .from('events')
    .select('id, title, start_time, end_time')
    .eq('user_id', user.id)
    .gte('start_time', startOfDay)
    .lt('start_time', endOfDay)
    .order('start_time', { ascending: true })

  if (error) {
    console.error('Error fetching events for date:', error)
    return []
  }

  return events.map((event) => ({
    ...event,
    id: String(event.id),
    start: new Date(event.start_time),
    end: new Date(event.end_time),
  }))
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
