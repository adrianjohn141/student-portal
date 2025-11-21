'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, MoreVertical, Calendar, BookOpen, CheckCircle, Circle, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { addTask, updateTaskStatus, deleteTask } from './actions'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

type Task = {
  id: number
  title: string
  description: string | null
  status: 'To Do' | 'In Progress' | 'Done'
  type: 'Assignment' | 'Quiz' | 'Chapter Test' | 'Exam'
  due_date: string | null
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
  courses 
}: { 
  initialTasks: Task[]
  courses: Course[]
}) {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

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
      // Revert not fully implemented for simplicity, would need to re-fetch
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    const formData = new FormData(e.currentTarget)
    
    try {
      await addTask(formData)
      toast.success('Task created')
      setIsModalOpen(false)
      router.refresh()
      // We also need to reload the page to fetch the new data since router.refresh() 
      // might not update the initialTasks prop immediately in this setup without more complex state management
      // But for now let's trust router.refresh() to trigger a re-render of the Server Component
      // which will pass new initialTasks.
      // However, since we have local state `tasks` initialized from `initialTasks`,
      // we need to watch for prop changes or just force reload.
      // Actually, the best pattern is to use `useEffect` to update local state when `initialTasks` changes,
      // or just use `router.refresh()` and not rely on local state for the *list* if we want server truth.
      // But we are doing optimistic updates.
      // Let's just reload for simplicity to ensure sync.
      window.location.reload() 
    } catch (error) {
      toast.error('Failed to create task')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Quizzes & Assignments</h1>
        <button
          onClick={() => setIsModalOpen(true)}
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
                      className="bg-zinc-900/70 border border-white/10 rounded-lg p-4 hover:bg-zinc-900/90 transition-colors group shadow-lg backdrop-blur-sm"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold border shadow-sm ${
                          task.type === 'Exam' ? 'bg-red-500/30 border-red-500/40 text-red-100' :
                          task.type === 'Quiz' ? 'bg-yellow-500/30 border-yellow-500/40 text-yellow-100' :
                          task.type === 'Chapter Test' ? 'bg-orange-500/30 border-orange-500/40 text-orange-100' :
                          'bg-blue-500/30 border-blue-500/40 text-blue-100'
                        }`}>
                          {task.type}
                        </span>
                        <div className="relative">
                          <button 
                            className="text-zinc-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                            onClick={() => setTaskToDelete(task)}
                            title="Delete task"
                          >
                            <MoreVertical size={18} />
                          </button>
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

      {/* Add Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Add New Task</h2>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Title</label>
                <input 
                  name="title" 
                  required 
                  placeholder="e.g., Calculus Midterm"
                  className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1">Type</label>
                <select 
                  name="type" 
                  className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 focus:outline-none focus:border-blue-500 transition-colors [&>option]:bg-zinc-900"
                >
                  <option value="Assignment">Assignment</option>
                  <option value="Quiz">Quiz</option>
                  <option value="Chapter Test">Chapter Test</option>
                  <option value="Exam">Exam</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1">Course (Optional)</label>
                <select 
                  name="course_id" 
                  className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 focus:outline-none focus:border-blue-500 transition-colors [&>option]:bg-zinc-900"
                >
                  <option value="none">None</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.course_code} - {course.course_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1">Due Date</label>
                <input 
                  name="due_date" 
                  type="datetime-local"
                  className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 focus:outline-none focus:border-blue-500 transition-colors [color-scheme:dark]"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1">Description</label>
                <textarea 
                  name="description" 
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                />
              </div>

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
                  {isSubmitting ? 'Creating...' : 'Create Task'}
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
