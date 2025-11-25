'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { TaskSchema, type TaskFormValues } from './schemas'

export async function getUserRole() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
    
  return profile?.role || 'student'
}

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
    .or(`user_id.eq.${user.id},is_global.eq.true`)
    .order('due_date', { ascending: true })
  
  if (error) {
    console.error('Error fetching tasks:', error)
    return []
  }
  
  return tasks
}

export async function addTask(data: TaskFormValues) {
  const result = TaskSchema.safeParse(data)
  
  if (!result.success) {
    throw new Error('Invalid input data')
  }

  const { title, description, type, due_date, course_id, is_global } = result.data

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return

  // If trying to create global task, verify admin role
  if (is_global) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile?.role !== 'admin') {
      throw new Error('Unauthorized to create global tasks')
    }
  }

  const { error } = await supabase.from('tasks').insert({
    user_id: user.id,
    title,
    description,
    type,
    due_date: due_date ? new Date(due_date).toISOString() : null,
    course_id: course_id && course_id !== 'none' ? parseInt(course_id) : null,
    status: 'To Do',
    is_global: is_global || false
  })

  if (error) {
    console.error('Error adding task:', error)
    throw new Error('Failed to add task')
  }

  revalidatePath('/tasks')
}

export async function updateTask(taskId: number, data: TaskFormValues) {
  const result = TaskSchema.safeParse(data)
  
  if (!result.success) {
    throw new Error('Invalid input data')
  }

  const { title, description, type, due_date, course_id, is_global } = result.data

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return

  // Check if user is owner or admin (for global tasks)
  const { data: task } = await supabase.from('tasks').select('*').eq('id', taskId).single()
  
  if (!task) throw new Error('Task not found')

  if (task.is_global) {
     const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile?.role !== 'admin') {
      throw new Error('Unauthorized to update global tasks')
    }
  } else if (task.user_id !== user.id) {
    // If it's not global, user must own it
    // Actually, admins might be able to edit anything, but usually user specific
    // For now, let's stick to owner
    throw new Error('Unauthorized to update this task')
  }

  const { error } = await supabase
    .from('tasks')
    .update({
      title,
      description,
      type,
      due_date: due_date ? new Date(due_date).toISOString() : null,
      course_id: course_id && course_id !== 'none' ? parseInt(course_id) : null,
      is_global: is_global || false
    })
    .eq('id', taskId)

  if (error) {
    console.error('Error updating task:', error)
    throw new Error('Failed to update task')
  }

  revalidatePath('/tasks')
}

export async function updateTaskStatus(taskId: number, status: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return
  
  // Note: Optimistic UI might update status of global tasks, need to verify permissions if necessary
  // But status update is usually allowed for students on their view if it's their own copy?
  // Wait, current logic: .eq('user_id', user.id) implies students can only update their OWN tasks.
  // Global tasks are created by admin. Can students update status of global tasks?
  // If global tasks are shared rows, updating status updates for EVERYONE.
  // If global tasks are "templates" copied to users, then they have their own.
  // Based on `getTasks` query: `.or(user_id.eq.${user.id},is_global.eq.true)`, it seems they are shared rows.
  // If a student updates status of a global task, it updates for everyone?
  // That seems like a bad design if so, but I won't change that logic right now unless asked.
  // However, the current `updateTaskStatus` has `.eq('user_id', user.id)`.
  // This means students CANNOT update status of global tasks because global tasks have admin's user_id.
  // So students can only see global tasks but not mark them as done?
  // That seems to be the current behavior. I will leave it as is to avoid breaking scope, 
  // unless I see an issue.
  
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
