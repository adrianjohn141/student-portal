'use client'

import { useState, useEffect } from 'react'
import { fetchEventsForDate } from '../schedule/actions'
import { formatInTimeZone } from 'date-fns-tz'

type Event = {
  id: string
  title: string
  start: Date
  end: Date
}

export default function TodaysClasses() {
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const getTodaysEvents = async () => {
      // Get today's date in the Philippine timezone
      const today = new Date()
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'Asia/Manila',
      }
      const formatter = new Intl.DateTimeFormat('en-US', options)
      const parts = formatter.formatToParts(today)
      const year = parts.find((part) => part.type === 'year')?.value
      const month = parts.find((part) => part.type === 'month')?.value
      const day = parts.find((part) => part.type === 'day')?.value
      const dateString = `${year}-${month}-${day}` // YYYY-MM-DD

      const todaysEvents = await fetchEventsForDate(dateString)
      setEvents(todaysEvents)
      setIsLoading(false)
    }

    getTodaysEvents()
  }, [])

  const formatTime = (date: Date) => {
    return formatInTimeZone(date, 'Asia/Manila', 'h:mm a')
  }

  if (isLoading) {
    return <p className="text-zinc-400">Loading classes...</p>
  }

  const dayName = formatInTimeZone(new Date(), 'Asia/Manila', 'EEEE')

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg">
      <h2 className="text-xl font-semibold mb-4">{dayName}'s Classes</h2>
      {events.length > 0 ? (
        <ul className="space-y-4">
          {events.map((event) => (
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
  )
}
