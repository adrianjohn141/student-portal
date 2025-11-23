import { getTasks, getEnrolledCourses, getUserRole } from './actions'
import TasksBoard from './TasksBoard'

export const dynamic = 'force-dynamic'

export default async function TasksPage() {
  const [tasks, courses, role] = await Promise.all([
    getTasks(),
    getEnrolledCourses(),
    getUserRole()
  ])

  // Transform tasks to match the component's expected type if needed
  // The raw Supabase response might need some type assertion or transformation
  const formattedTasks = tasks.map(task => ({
    ...task,
    course: Array.isArray(task.course) ? task.course[0] : task.course
  })) as any

  return (
    <div className="h-[calc(100vh-6rem)]">
      <TasksBoard 
        initialTasks={formattedTasks} 
        courses={courses} 
        userRole={role}
      />
    </div>
  )
}
