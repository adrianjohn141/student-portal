'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function getTasks() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return []

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select(`
      *,
      course:courses(course_name, course_code, instructor)
    `)
    .eq('user_id', user.id)
    .order('due_date', { ascending: true })
  
  if (error) {
    console.error('Error fetching tasks:', error)
    return []
  }
  
  return tasks
}

export async function addTask(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const type = formData.get('type') as string
  const due_date = formData.get('due_date') as string
  const course_id = formData.get('course_id') as string

  const { error } = await supabase.from('tasks').insert({
    user_id: user.id,
    title,
    description,
    type,
    due_date: due_date ? new Date(due_date).toISOString() : null,
    course_id: course_id && course_id !== 'none' ? parseInt(course_id) : null,
    status: 'To Do'
  })

  if (error) {
    console.error('Error adding task:', error)
    throw new Error('Failed to add task')
  }

  revalidatePath('/tasks')
}

export async function updateTaskStatus(taskId: number, status: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return
  
  const { error } = await supabase
    .from('tasks')
    .update({ status })
    .eq('id', taskId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error updating task:', error)
    throw new Error('Failed to update task')
  }

  revalidatePath('/tasks')
}

export async function deleteTask(taskId: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return
  
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting task:', error)
    throw new Error('Failed to delete task')
  }

  revalidatePath('/tasks')
}

type Course = {
  id: number
  course_code: string | null
  course_name: string | null
}

export async function getEnrolledCourses() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return []

  const { data: studentCoursesData } = await supabase
    .from("student_courses")
    .select("courses (id, course_code, course_name)")
    .eq("student_id", user.id)

  const enrolled = (studentCoursesData
    ?.map(sc => {
      if (
        sc.courses &&
        typeof sc.courses === "object" &&
        !Array.isArray(sc.courses)
      ) {
        return sc.courses as Course
      }
      return null
    })
    .filter((c): c is Course => c !== null) || [])
    .sort((a, b) =>
      (a.course_code || "").localeCompare(b.course_code || "")
    )
    
  return enrolled
}
