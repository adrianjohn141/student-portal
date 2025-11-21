'use client'

import { useState, useEffect } from 'react'
import { getTasks } from '../tasks/actions'
import { format } from 'date-fns'
import { CheckCircle, Clock, Circle, BookOpen } from 'lucide-react'
import { Skeleton } from '@/components/Skeleton'

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

export default function UpcomingTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const allTasks = await getTasks()
        // Filter for active tasks (not Done)
        const activeTasks = (allTasks as unknown as Task[])
          .filter(task => task.status !== 'Done')
          .sort((a, b) => {
            if (!a.due_date) return 1
            if (!b.due_date) return -1
            return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
          })
        setTasks(activeTasks)
      } catch (error) {
        console.error('Failed to fetch tasks', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTasks()
  }, [])

  if (isLoading) {
    return (
      <div className="bg-white/10 backdrop-blur-md border border-white/10 p-6 rounded-xl shadow-lg">
        <Skeleton className="h-8 w-48 mb-4 bg-white/5" />
        <div className="space-y-4">
          <Skeleton className="h-16 w-full bg-white/5" />
          <Skeleton className="h-16 w-full bg-white/5" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/10 p-6 rounded-xl shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">Upcoming Tasks</h2>
        <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-500/30">
          {tasks.length} Pending
        </span>
      </div>
      
      {tasks.length > 0 ? (
        <ul className="space-y-3">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="flex items-center justify-between p-4 bg-black/20 hover:bg-black/30 transition-colors rounded-lg border border-white/5 group"
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {task.status === 'In Progress' ? (
                    <Clock size={18} className="text-blue-400" />
                  ) : (
                    <Circle size={18} className="text-zinc-400" />
                  )}
                </div>
                
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{task.title}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
                      task.type === 'Exam' ? 'bg-red-500/20 border-red-500/30 text-red-200' :
                      task.type === 'Quiz' ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-200' :
                      task.type === 'Chapter Test' ? 'bg-orange-500/20 border-orange-500/30 text-orange-200' :
                      'bg-blue-500/20 border-blue-500/30 text-blue-200'
                    }`}>
                      {task.type}
                    </span>
                  </div>
                  
                  {task.course && (
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-1">
                      <BookOpen size={12} />
                      <span>
                        {task.course.course_code} • {task.course.course_name}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-right ml-4">
                {task.due_date && (
                  <div className={`text-sm font-medium ${
                    new Date(task.due_date) < new Date() 
                      ? 'text-red-300' 
                      : 'text-zinc-300'
                  }`}>
                    {format(new Date(task.due_date), 'MMM d, h:mm a')}
                  </div>
                )}
                <div className="text-xs text-zinc-500 mt-1">
                  {task.status}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-zinc-400">
          <CheckCircle size={48} className="mb-2 opacity-50 text-green-500" />
          <p className="text-sm italic">No upcoming tasks!</p>
          <p className="text-xs text-zinc-500 mt-1">You're all caught up.</p>
        </div>
      )}
    </div>
  )
}
