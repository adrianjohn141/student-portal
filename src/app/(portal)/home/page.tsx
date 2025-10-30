import { createClient } from '@/lib/supabase/server'
import { fetchTodaysEvents } from '../schedule/actions'

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

  const todaysEvents = await fetchTodaysEvents()

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">
        Welcome, {profile?.full_name || user?.email || 'Student'}!
      </h1>
      <p className="text-zinc-400 mb-8">
        Here are your classes scheduled for today.
      </p>

      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Today's Classes</h2>
        {todaysEvents.length > 0 ? (
          <ul className="space-y-4">
            {todaysEvents.map((event) => (
              <li
                key={event.id}
                className="flex items-center justify-between p-4 bg-zinc-800 rounded-md"
              >
                <span className="font-medium">{event.title}</span>
                <span className="text-sm text-zinc-400">
                  {formatTime(event.start)} - {formatTime(event.end)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-zinc-400">You have no classes scheduled for today.</p>
        )}
      </div>
    </div>
  )
}
