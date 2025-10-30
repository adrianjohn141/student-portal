import { createClient } from '@/lib/supabase/server'
import TodaysClasses from './TodaysClasses'

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
        Here are your classes scheduled for today.
      </p>

      <TodaysClasses />
    </div>
  )
}
