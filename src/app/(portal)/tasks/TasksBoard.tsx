'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, MoreVertical, Calendar, BookOpen, CheckCircle, Circle, Clock, Pencil, Trash2, X } from 'lucide-react'
import { format } from 'date-fns'
import { addTask, updateTaskStatus, deleteTask, updateTask } from './actions'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { TaskSchema, type TaskFormValues } from './schemas'

type Task = {
  id: number
  title: string
  description: string | null
  status: 'To Do' | 'In Progress' | 'Done'
  type: 'Assignment' | 'Quiz' | 'Chapter Test' | 'Exam' | 'Activity'
  due_date: string | null
  is_global: boolean
  course_id: number | null
  course: {
    course_code: string | null
    course_name: string | null
    instructor: string | null
  } | null
}

type Course = {
  id: number
  course_code: string | null
  course_name: string | null
}

export default function TasksBoard({ 
  initialTasks, 
  courses,
  userRole
}: { 
  initialTasks: Task[]
  courses: Course[]
  userRole: string | null
}) {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null)
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(TaskSchema),
    defaultValues: {
      type: 'Assignment',
      course_id: 'none',
    }
  })

  // Open modal for editing
  useEffect(() => {
    if (taskToEdit) {
      setValue('title', taskToEdit.title)
      setValue('type', taskToEdit.type)
      setValue('description', taskToEdit.description || '')
      setValue('course_id', taskToEdit.course_id?.toString() || 'none')
      
      if (taskToEdit.due_date) {
        // Format for datetime-local input: YYYY-MM-DDThh:mm
        const date = new Date(taskToEdit.due_date)
        const dateString = date.toISOString().slice(0, 16)
        setValue('due_date', dateString)
      }
      
      setValue('is_global', taskToEdit.is_global)
      setIsModalOpen(true)
    }
  }, [taskToEdit, setValue])

  // Reset form when modal closes
  useEffect(() => {
    if (!isModalOpen) {
      // Small delay to prevent clearing while animating out if we had animation
      // But mainly to ensure next open is clean
      // Actually, we want to clear taskToEdit when modal closes
      if (taskToEdit) {
         setTaskToEdit(null)
      }
      reset({
        type: 'Assignment',
        course_id: 'none',
      })
    }
  }, [isModalOpen, reset]) // Removed taskToEdit dependency to avoid loop, handled logically

  const columns = [
    { id: 'To Do', title: 'To Do', icon: Circle, color: 'text-zinc-200' },
    { id: 'In Progress', title: 'In Progress', icon: Clock, color: 'text-blue-300' },
    { id: 'Done', title: 'Done', icon: CheckCircle, color: 'text-green-300' },
  ] as const

  const handleStatusChange = async (taskId: number, newStatus: string) => {
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus as any } : t))
    
    try {
      await updateTaskStatus(taskId, newStatus)
      toast.success('Task updated')
    } catch (error) {
      toast.error('Failed to update task')
      // Revert on error - in a real app we'd fetch fresh data
      router.refresh()
    }
  }

  const confirmDelete = async () => {
    if (!taskToDelete) return
    
    setIsDeleting(true)
    const taskId = taskToDelete.id

    // Optimistic update
    setTasks(prev => prev.filter(t => t.id !== taskId))
    setTaskToDelete(null)
    
    try {
      await deleteTask(taskId)
      toast.success('Task deleted')
      router.refresh()
    } catch (error) {
      toast.error('Failed to delete task')
      router.refresh()
    } finally {
      setIsDeleting(false)
    }
  }

  const onFormSubmit = async (data: TaskFormValues) => {
    try {
      if (taskToEdit) {
        await updateTask(taskToEdit.id, data)
        toast.success('Task updated successfully')
      } else {
        await addTask(data)
        toast.success('Task created successfully')
      }
      setIsModalOpen(false)
      // Force reload to ensure everything is synced since we use router.refresh() in actions 
      // but client state might drift with complex optimistic updates if we don't manage it perfectly
      window.location.reload()
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('An unexpected error occurred')
      }
    }
  }

  const openAddModal = () => {
    setTaskToEdit(null)
    reset({
        type: 'Assignment',
        course_id: 'none',
    })
    setIsModalOpen(true)
  }

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Quizzes & Assignments</h1>
        <button
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          <span>Add Task</span>
        </button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full overflow-x-auto pb-4">
        {columns.map(column => (
          <div key={column.id} className="flex flex-col gap-4 min-w-[300px]">
            <div className="flex items-center gap-2 font-bold text-white pb-2 border-b border-white/20">
              <column.icon size={20} className={column.color} />
              <span className="text-lg">{column.title}</span>
              <span className="text-sm bg-white/20 px-2 py-0.5 rounded-full text-zinc-200 font-medium">
                {tasks.filter(t => t.status === column.id).length}
              </span>
            </div>

            <div className="flex flex-col gap-3">
              <AnimatePresence>
                {tasks
                  .filter(t => t.status === column.id)
                  .map(task => (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`bg-zinc-900/70 border ${task.is_global ? 'border-purple-500/30' : 'border-white/10'} rounded-lg p-4 hover:bg-zinc-900/90 transition-colors group shadow-lg backdrop-blur-sm`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-bold border shadow-sm ${
                            task.type === 'Exam' ? 'bg-red-500/30 border-red-500/40 text-red-100' :
                            task.type === 'Quiz' ? 'bg-yellow-500/30 border-yellow-500/40 text-yellow-100' :
                            task.type === 'Chapter Test' ? 'bg-orange-500/30 border-orange-500/40 text-orange-100' :
                            task.type === 'Activity' ? 'bg-teal-500/30 border-teal-500/40 text-teal-100' :
                            'bg-blue-500/30 border-blue-500/40 text-blue-100'
                          }`}>
                            {task.type}
                          </span>
                          {task.is_global && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-bold border shadow-sm bg-purple-500/30 border-purple-500/40 text-purple-100">
                              Global
                            </span>
                          )}
                        </div>
                        <div className="relative flex gap-1">
                          {(userRole === 'admin' || !task.is_global) && (
                            <>
                              <button 
                                className="text-zinc-400 hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                onClick={() => setTaskToEdit(task)}
                                title="Edit task"
                              >
                                <Pencil size={16} />
                              </button>
                              <button 
                                className="text-zinc-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                onClick={() => setTaskToDelete(task)}
                                title="Delete task"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      <h3 className="font-bold text-lg text-white mb-1">{task.title}</h3>
                      
                      {task.description && (
                        <p className="text-sm text-zinc-300 mb-3 line-clamp-2">{task.description}</p>
                      )}

                      <div className="flex flex-col gap-2 mt-3 text-sm text-zinc-300 font-medium">
                        {task.course && (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                              <BookOpen size={14} className="text-zinc-400" />
                              <span>{task.course.course_code} - {task.course.course_name}</span>
                            </div>
                            {task.course.instructor && (
                              <div className="flex items-center gap-1.5 text-xs text-zinc-400 ml-5">
                                <span>{task.course.instructor}</span>
                              </div>
                            )}
                          </div>
                        )}
                        {task.due_date && (
                          <div className={`flex items-center gap-1.5 ${
                            new Date(task.due_date) < new Date() && task.status !== 'Done' 
                              ? 'text-red-300 font-bold' 
                              : 'text-zinc-300'
                          }`}>
                            <Calendar size={14} className={new Date(task.due_date) < new Date() && task.status !== 'Done' ? 'text-red-300' : 'text-zinc-400'} />
                            <span>{format(new Date(task.due_date), 'MMM d, h:mm a')}</span>
                          </div>
                        )}
                      </div>

                      {/* Move Actions */}
                      {(userRole === 'admin' || !task.is_global) && (
                        <div className="flex gap-1 mt-4 pt-3 border-t border-white/10">
                          {column.id !== 'To Do' && (
                            <button
                              onClick={() => handleStatusChange(task.id, 'To Do')}
                              className="text-xs px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition-colors font-medium"
                            >
                              To Do
                            </button>
                          )}
                          {column.id !== 'In Progress' && (
                            <button
                              onClick={() => handleStatusChange(task.id, 'In Progress')}
                              className="text-xs px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition-colors font-medium"
                            >
                              In Progress
                            </button>
                          )}
                          {column.id !== 'Done' && (
                            <button
                              onClick={() => handleStatusChange(task.id, 'Done')}
                              className="text-xs px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition-colors font-medium"
                            >
                              Done
                            </button>
                          )}
                        </div>
                      )}
                    </motion.div>
                  ))}
              </AnimatePresence>
              
              {tasks.filter(t => t.status === column.id).length === 0 && (
                <div className="text-center py-8 text-zinc-400 text-sm border-2 border-dashed border-white/10 rounded-lg">
                  No tasks
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
               <h2 className="text-xl font-bold">{taskToEdit ? 'Edit Task' : 'Add New Task'}</h2>
               <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white">
                  <X size={24} />
               </button>
            </div>
            
            <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Title</label>
                <input 
                  {...register('title')}
                  placeholder="e.g., Calculus Midterm"
                  className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 focus:outline-none focus:border-blue-500 transition-colors"
                />
                {errors.title && (
                  <span className="text-red-400 text-xs mt-1">{errors.title.message}</span>
                )}
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1">Type</label>
                <select 
                  {...register('type')}
                  className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 focus:outline-none focus:border-blue-500 transition-colors [&>option]:bg-zinc-900"
                >
                  <option value="Assignment">Assignment</option>
                  <option value="Quiz">Quiz</option>
                  <option value="Chapter Test">Chapter Test</option>
                  <option value="Exam">Exam</option>
                  <option value="Activity">Activity</option>
                </select>
                {errors.type && (
                  <span className="text-red-400 text-xs mt-1">{errors.type.message}</span>
                )}
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1">Course (Optional)</label>
                <select 
                  {...register('course_id')}
                  className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 focus:outline-none focus:border-blue-500 transition-colors [&>option]:bg-zinc-900"
                >
                  <option value="none">None</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.course_code} - {course.course_name}
                    </option>
                  ))}
                </select>
                {errors.course_id && (
                  <span className="text-red-400 text-xs mt-1">{errors.course_id.message}</span>
                )}
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1">Due Date</label>
                <input 
                  type="datetime-local"
                  {...register('due_date')}
                  className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 focus:outline-none focus:border-blue-500 transition-colors [color-scheme:dark]"
                />
                {errors.due_date && (
                  <span className="text-red-400 text-xs mt-1">{errors.due_date.message}</span>
                )}
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1">Description</label>
                <textarea 
                  {...register('description')}
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                />
                {errors.description && (
                  <span className="text-red-400 text-xs mt-1">{errors.description.message}</span>
                )}
              </div>

              {userRole === 'admin' && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_global"
                    {...register('is_global')}
                    className="w-4 h-4 rounded border-white/10 bg-white/5 text-blue-600 focus:ring-blue-500 focus:ring-offset-zinc-900"
                  />
                  <label htmlFor="is_global" className="text-sm text-zinc-400 select-none cursor-pointer">
                    Global Event (Visible to all users)
                  </label>
                </div>
              )}

              <div className="flex gap-3 mt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 rounded-md hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (taskToEdit ? 'Updating...' : 'Creating...') : (taskToEdit ? 'Update Task' : 'Create Task')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {taskToDelete && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-white/20 rounded-xl p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-2">Delete Task?</h2>
            <p className="text-zinc-300 mb-4">
              Are you sure you want to delete <span className="text-white font-medium">"{taskToDelete.title}"</span>? This action cannot be undone.
            </p>
            
            {taskToDelete.course && (
              <div className="bg-white/10 border border-white/10 rounded-lg p-3 mb-6 text-sm">
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Course:</span>
                    <span className="text-zinc-100 font-medium text-right">{taskToDelete.course.course_name}</span>
                  </div>
                  {taskToDelete.course.instructor && (
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Instructor:</span>
                      <span className="text-zinc-100 font-medium text-right">{taskToDelete.course.instructor}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button 
                type="button"
                onClick={() => setTaskToDelete(null)}
                className="flex-1 px-4 py-2 rounded-md hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
