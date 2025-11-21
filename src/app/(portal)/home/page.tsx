import { createClient } from '@/lib/supabase/server'
import TodaysClasses from './TodaysClasses'
import UpcomingTasks from './UpcomingTasks'

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user!.id)
    .single()

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">
        Welcome, {profile?.full_name || user?.email || 'Student'}!
      </h1>
      <p className="text-zinc-400 mb-8">
        Here is your dashboard overview.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TodaysClasses />
        <UpcomingTasks />
      </div>
    </div>
  )
}
