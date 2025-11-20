'use client'

import { useState, useEffect } from 'react'
import { fetchEventsForDate } from '../schedule/actions'
import { formatInTimeZone } from 'date-fns-tz'
import { Coffee } from 'lucide-react'
import { Skeleton } from '@/components/Skeleton'

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

  const dayName = formatInTimeZone(new Date(), 'Asia/Manila', 'EEEE')

  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/10 p-6 rounded-xl shadow-lg">
      <h2 className="text-xl font-semibold mb-4 text-white">{dayName}'s Classes</h2>
      {events.length > 0 ? (
        <ul className="space-y-4">
          {events.map((event) => (
            <li
              key={event.id}
              className="flex items-center justify-between p-4 bg-black/20 hover:bg-black/30 transition-colors rounded-lg border border-white/5"
            >
              <span className="font-medium text-white">{event.title}</span>
              <span className="text-sm text-zinc-300">
                {formatTime(event.start)} - {formatTime(event.end)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-zinc-400">
          <Coffee size={48} className="mb-2 opacity-50" />
          <p className="text-sm italic">You have no classes scheduled for today.</p>
          <p className="text-xs text-zinc-500 mt-1">Enjoy your free time!</p>
        </div>
      )}
    </div>
  )
}
