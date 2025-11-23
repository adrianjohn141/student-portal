'use client'

import { useState, startTransition, useOptimistic, useCallback, useRef, useEffect } from 'react'
import {
  Calendar as BigCalendar,
  dateFnsLocalizer,
  SlotInfo,
  Event as CalendarEvent,
  View,
  } from 'react-big-calendar'
import { parse, startOfWeek, getDay } from 'date-fns'
import type { Locale } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { formatInTimeZone } from 'date-fns-tz'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { createEvent, updateEvent, deleteEvent } from '../actions'
import { X, Trash2, AlertCircle } from 'lucide-react'
import eventBus from '@/lib/eventBus'
import { fetchEvents } from '../actions'

// --- TIMEZONE SETUP ---
const timeZone = 'Asia/Manila'
const locales = { 'en-US': enUS }
const localizer = dateFnsLocalizer({
  format: (date: Date, formatStr: string, options?: { locale?: Locale }) =>
    formatInTimeZone(date, timeZone, formatStr, options),
  parse,
  startOfWeek,
  getDay,
  locales,
})

// Ensure MyEventType matches exactly what fetchEvents returns AFTER mapping
interface MyEventType {
  id: string // Should be string after mapping in fetchEvents
  title: string
  start: Date
  end: Date
  isCourseEvent?: boolean
}

// Helper function to format Date for input[type=datetime-local] in Asia/Manila timezone
const formatForInput = (date: Date): string => {
  try {
    // Format the UTC date from the server into the 'YYYY-MM-DDTHH:mm' string
    // that the input expects, interpreted in the 'Asia/Manila' timezone.
    return formatInTimeZone(date, timeZone, "yyyy-MM-dd'T'HH:mm")
  } catch (e) {
    console.error('Error formatting date:', e)
    // Fallback to the current time in the target timezone
    return formatInTimeZone(new Date(), timeZone, "yyyy-MM-dd'T'HH:mm")
  }
}

// Optimistic Update Reducer remains the same
type OptimisticAction =
  | { type: 'ADD'; payload: MyEventType }
  | { type: 'UPDATE'; payload: MyEventType }
  | { type: 'DELETE'; payload: { id: string } }

const eventsReducer = (state: MyEventType[], action: OptimisticAction): MyEventType[] => {
  switch (action.type) {
    case 'ADD':
      return [...state, { ...action.payload, id: action.payload.id || `optimistic-${Date.now()}` }];
    case 'UPDATE':
      return state.map(event =>
        event.id === action.payload.id ? { ...event, ...action.payload } : event
      );
    case 'DELETE':
      return state.filter(event => event.id !== action.payload.id);
    default:
      return state;
  }
};


export default function Calendar({ initialEvents }: { initialEvents: MyEventType[] }) {
  const [events, setEvents] = useState<MyEventType[]>(initialEvents)
  const [optimisticEvents, dispatchOptimisticEvent] = useOptimistic(
    events,
    eventsReducer
  )
  const [selectedSlot, setSelectedSlot] = useState<SlotInfo | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<MyEventType | null>(null)
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add')
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());

  // Update local state when initialEvents prop changes (e.g. after revalidatePath)
  useEffect(() => {
    setEvents(initialEvents)
  }, [initialEvents])

  // --- ADDED useEffect FOR DEBUGGING ---
  useEffect(() => {
    const handleCourseChange = async () => {
      const newEvents = await fetchEvents()
      setEvents(newEvents)
    }

    eventBus.on('course-changed', handleCourseChange)

    return () => {
      eventBus.off('course-changed', handleCourseChange)
    }
  }, [])

  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
    setSelectedSlot(slotInfo)
    setSelectedEvent(null)
    setModalMode('add')
    setError(null);
    setIsModalOpen(true)
  }, [])

  const handleSelectEvent = useCallback((event: MyEventType) => {
    console.log("Event Clicked:", event); // <-- Check browser console
    // Ensure event has an ID before trying to edit
    if (!event.id) {
        console.error("Clicked event is missing an ID:", event);
        setError("Cannot edit event without an ID.");
        return;
    }
    setSelectedEvent(event)
    setSelectedSlot(null)
    // If it is a course event, set mode to 'view' (read-only)
    setModalMode(event.isCourseEvent ? 'view' : 'edit')
    setError(null);
    setIsModalOpen(true)
  }, [])


  const handleCancel = () => {
    setIsModalOpen(false)
    setSelectedSlot(null)
    setSelectedEvent(null)
    setError(null);
  }

  useEffect(() => {
    if (!isModalOpen) {
        formRef.current?.reset();
    }
  }, [isModalOpen])

  // --- CREATE ---
  async function handleCreateEvent(formData: FormData) {
    setError(null);
    const title = formData.get('title') as string
    const start_time = formData.get('start_time') as string
    const end_time = formData.get('end_time') as string

    if (!title || !start_time || !end_time) {
        setError("Please fill in all fields.");
        return;
    }
    const newEventData = {
      id: `optimistic-${Date.now()}`, // Use temp ID
      title,
      // When creating a new event for optimistic update, ensure the date is created in the correct timezone context
      start: new Date(`${start_time}:00+08:00`),
      end: new Date(`${end_time}:00+08:00`),
    }
    startTransition(() => {
      dispatchOptimisticEvent({ type: 'ADD', payload: newEventData })
    })
    const serverFormData = new FormData()
    serverFormData.append('title', title)
    // Convert the form's local datetime string (assumed to be in Asia/Manila) to a UTC ISO string for the server
    // HACK: Hardcoding UTC+8 offset for Asia/Manila since zonedTimeToUtc is causing issues.
    // This is not robust for timezones with DST, but should be fine for the Philippines.
    serverFormData.append('start_time', new Date(`${start_time}:00+08:00`).toISOString())
    serverFormData.append('end_time', new Date(`${end_time}:00+08:00`).toISOString())
    const result = await createEvent(serverFormData)
    console.log("Create Event Result:", result);
    if (result?.error) {
       setError(result.error);
    } else {
        setIsModalOpen(false)
        setSelectedSlot(null)
    }
  }

  // --- UPDATE ---
  async function handleUpdateEvent(formData: FormData) {
    setError(null);
    const id = formData.get('id') as string;
    const title = formData.get('title') as string
    const start_time = formData.get('start_time') as string
    const end_time = formData.get('end_time') as string

    if (!id || !title || !start_time || !end_time || !selectedEvent) {
        setError("Invalid data for update.");
        return;
    }
    const updatedEventData = { id, title, start: new Date(`${start_time}:00+08:00`), end: new Date(`${end_time}:00+08:00`), }
    startTransition(() => {
      dispatchOptimisticEvent({ type: 'UPDATE', payload: updatedEventData })
    })
    const serverFormData = new FormData()
    serverFormData.append('id', id)
    serverFormData.append('title', title)
    // Convert the form's local datetime string (assumed to be in Asia/Manila) to a UTC ISO string for the server
    // HACK: Hardcoding UTC+8 offset for Asia/Manila since zonedTimeToUtc is causing issues.
    // This is not robust for timezones with DST, but should be fine for the Philippines.
    serverFormData.append('start_time', new Date(`${start_time}:00+08:00`).toISOString())
    serverFormData.append('end_time', new Date(`${end_time}:00+08:00`).toISOString())
    const result = await updateEvent(serverFormData);
    console.log("Update Event Result:", result);
    if (result?.error) {
       setError(result.error);
    } else {
        setIsModalOpen(false)
        setSelectedEvent(null)
    }
  }

  // --- DELETE ---
  async function handleDeleteEvent() {
    setError(null);
    if (!selectedEvent || !selectedEvent.id) {
        setError("No event selected for deletion.");
        return;
    };
    const eventIdToDelete = selectedEvent.id;
    startTransition(() => {
      dispatchOptimisticEvent({ type: 'DELETE', payload: { id: eventIdToDelete } })
    })
    const formData = new FormData();
    formData.append('id', eventIdToDelete);
    const result = await deleteEvent(formData);
    console.log("Delete Event Result:", result);
    if (result?.error) {
        setError(result.error);
    } else {
        setIsModalOpen(false)
        setSelectedEvent(null)
    }
  }

  const formAction = modalMode === 'edit' ? handleUpdateEvent : handleCreateEvent; // Default to create for view mode too, though disabled
  let modalTitle = 'Add New Event';
  if (modalMode === 'edit') modalTitle = 'Edit Event';
  if (modalMode === 'view') modalTitle = 'Course Event Details';
  
  const submitButtonText = modalMode === 'edit' ? 'Update Event' : 'Create Event';

  // Custom Event Style Getter to color code course events
  const eventPropGetter = useCallback(
    (event: MyEventType) => {
      if (event.isCourseEvent) {
        return {
          style: {
            backgroundColor: '#43037eff', // Violet-600 for courses (matches theme)
            borderColor: '#8f00a1ff', // Violet-700
            color: '#ffffffff',
          },
        }
      }
      return {
        style: {
           backgroundColor: '#0d9488', // Teal-600 for custom events
           borderColor: '#0f766e', // Teal-700
           color: '#ffffff',
        }
      }
    },
    []
  )

  return (
    <div className="flex flex-col gap-8 relative">
      {/* --- Calendar Display --- */}
      <div className="w-full min-h-[70vh] rounded-lg bg-white/10 border border-white/20 backdrop-blur-lg p-4">
        <BigCalendar
          localizer={localizer}
          events={optimisticEvents.map(e => ({...e, id: String(e.id)}))}
          startAccessor="start"
          endAccessor="end"
          selectable
          onSelectSlot={handleSelectSlot}
          onSelectEvent={(event) => handleSelectEvent(event as MyEventType)}
          style={{ height: '90vh' }}
          eventPropGetter={eventPropGetter}
          popup
          view={view}
          date={date}
          onView={(view) => setView(view)}
          onNavigate={(date) => setDate(date)}
        />
      </div>

      {/* --- MODAL POPUP --- (No changes needed in structure) */}
      {isModalOpen && (selectedSlot || selectedEvent) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={handleCancel}
        >
          <div
            className="bg-black/40 border border-white/20 backdrop-blur-xl p-6 rounded-xl w-full max-w-md relative shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleCancel}
              className="absolute top-3 right-3 p-1 rounded-full text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-semibold mb-6 text-center text-white">{modalTitle}</h2>

             {/* ERROR DISPLAY */}
            {error && (
              <div className="mb-4 p-3 bg-red-900/80 border border-red-700 text-red-100 text-sm rounded-md flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
            
            {modalMode === 'view' && (
               <div className="mb-4 p-3 bg-blue-900/40 border border-blue-700 text-blue-100 text-sm rounded-md">
                  This event is part of your enrolled course schedule and cannot be edited here.
               </div>
            )}

            <form
              ref={formRef}
              action={formAction}
              className="flex flex-col gap-4"
            >
              {(modalMode === 'edit' || modalMode === 'view') && selectedEvent && (
                <input type="hidden" name="id" value={selectedEvent.id} />
              )}
              {/* Form fields remain the same */}
               <div>
                <label htmlFor="title" className="block text-sm text-zinc-400 mb-2">
                  Event Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  disabled={modalMode === 'view'}
                  defaultValue={
                    (modalMode === 'edit' || modalMode === 'view') ? selectedEvent?.title : ''
                  }
                  className="w-full px-3 py-2 rounded-md bg-black/20 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors hover:bg-black/30 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label htmlFor="start_time" className="block text-sm text-zinc-400 mb-2">
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  id="start_time"
                  name="start_time"
                  required
                  disabled={modalMode === 'view'}
                  // Ensure selectedEvent/Slot exist before accessing start/end
                  defaultValue={formatForInput(
                      (modalMode === 'edit' || modalMode === 'view') && selectedEvent ? selectedEvent.start :
                      selectedSlot ? selectedSlot.start : new Date() // Fallback added
                  )}
                  className="w-full px-3 py-2 rounded-md bg-black/20 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 calendar-input transition-colors hover:bg-black/30 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label htmlFor="end_time" className="block text-sm text-zinc-400 mb-2">
                  End Time
                </label>
                <input
                  type="datetime-local"
                  id="end_time"
                  name="end_time"
                  required
                  disabled={modalMode === 'view'}
                  defaultValue={formatForInput(
                      (modalMode === 'edit' || modalMode === 'view') && selectedEvent ? selectedEvent.end :
                      selectedSlot ? selectedSlot.end : new Date() // Fallback added
                  )}
                  className="w-full px-3 py-2 rounded-md bg-black/20 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 calendar-input transition-colors hover:bg-black/30 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              {/* Buttons remain the same */}
               <div className={`flex ${modalMode === 'edit' ? 'justify-between' : 'justify-end'} items-center mt-2`}>
                 {modalMode === 'edit' && (
                  <button
                    type="button"
                    onClick={handleDeleteEvent}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-white font-medium flex items-center gap-2 transition-colors"
                    aria-label="Delete event"
                  >
                    <Trash2 size={16}/> Delete
                  </button>
                 )}
                 {modalMode !== 'view' && (
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-medium transition-colors"
                  >
                    {submitButtonText}
                  </button>
                 )}
                 {modalMode === 'view' && (
                   <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 bg-zinc-600 hover:bg-zinc-700 rounded-md text-white font-medium transition-colors"
                   >
                     Close
                   </button>
                 )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
