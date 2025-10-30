import { fetchEvents } from './actions'
import Calendar from './components/Calendar'

export default async function SchedulePage() {
  // Fetch events on the server
  const initialEvents = await fetchEvents()

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">My Schedule</h1>

      {/* Render the Client Component, passing server-fetched data */}
      <Calendar initialEvents={initialEvents} />
    </div>
  )
}