'use client'

// Add useEffect back to imports
import { useState, startTransition, useOptimistic, useCallback, useRef, useEffect } from 'react'
import {
  Calendar as BigCalendar,
  dateFnsLocalizer,
  SlotInfo,
  Event as CalendarEvent,
  View,
} from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { createEvent, updateEvent, deleteEvent } from '../actions'
import { X, Trash2, AlertCircle } from 'lucide-react'

// Setup remains the same
const locales = { 'en-US': enUS }
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales })

// Ensure MyEventType matches exactly what fetchEvents returns AFTER mapping
interface MyEventType {
  id: string // Should be string after mapping in fetchEvents
  title: string
  start: Date
  end: Date
}

// Helper function to format Date for input[type=datetime-local]
const formatForInput = (date: Date): string => {
   try {
    const timezoneOffset = date.getTimezoneOffset() * 60000;
    const localISOTime = new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
    return localISOTime;
  } catch (e) {
    console.error('Error formatting date:', e)
    const now = new Date();
    const timezoneOffset = now.getTimezoneOffset() * 60000;
    const localISOTime = new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 16);
    return localISOTime;
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
  const [optimisticEvents, dispatchOptimisticEvent] = useOptimistic(
    initialEvents,
    eventsReducer
  )
  const [selectedSlot, setSelectedSlot] = useState<SlotInfo | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<MyEventType | null>(null)
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());

  // --- ADDED useEffect FOR DEBUGGING ---
  useEffect(() => {
    console.log("Calendar Component Mounted (Effect)");
    // Cleanup function: Log when component unmounts
    return () => {
      console.log("Calendar Component Unmounted (Effect)");
    };
  }, []); // Empty dependency array means this runs only on mount and unmount
  // --- END OF ADDED useEffect ---

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
    setModalMode('edit')
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
      start: new Date(start_time),
      end: new Date(end_time),
    }
    startTransition(() => {
      dispatchOptimisticEvent({ type: 'ADD', payload: newEventData })
    })
    const serverFormData = new FormData()
    serverFormData.append('title', title)
    serverFormData.append('start_time', new Date(start_time).toISOString())
    serverFormData.append('end_time', new Date(end_time).toISOString())
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
    const updatedEventData = { id, title, start: new Date(start_time), end: new Date(end_time), }
    startTransition(() => {
      dispatchOptimisticEvent({ type: 'UPDATE', payload: updatedEventData })
    })
    const serverFormData = new FormData()
    serverFormData.append('id', id)
    serverFormData.append('title', title)
    serverFormData.append('start_time', new Date(start_time).toISOString())
    serverFormData.append('end_time', new Date(end_time).toISOString())
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

  const formAction = modalMode === 'edit' ? handleUpdateEvent : handleCreateEvent;
  const modalTitle = modalMode === 'edit' ? 'Edit Event' : 'Add New Event';
  const submitButtonText = modalMode === 'edit' ? 'Update Event' : 'Create Event';

  return (
    <div className="flex flex-col gap-8 relative">
{/* --- Calendar Display --- */}
      <div className="w-full min-h-[70vh] rounded-lg"> {/* Removed bg/border inherit */}
        <BigCalendar
          localizer={localizer}
          events={optimisticEvents.map(e => ({...e, id: String(e.id)}))}
          startAccessor="start"
          endAccessor="end"
          selectable
          onSelectSlot={handleSelectSlot}
          onSelectEvent={(event) => handleSelectEvent(event as MyEventType)}
          style={{ height: '90vh' }}
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
            className="bg-zinc-900 border border-zinc-700 p-6 rounded-lg w-full max-w-md relative shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleCancel}
              className="absolute top-3 right-3 p-1 rounded-full text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-semibold mb-6 text-center text-zinc-100">{modalTitle}</h2>

             {/* ERROR DISPLAY */}
            {error && (
              <div className="mb-4 p-3 bg-red-900/80 border border-red-700 text-red-100 text-sm rounded-md flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form
              ref={formRef}
              action={formAction}
              className="flex flex-col gap-4"
            >
              {modalMode === 'edit' && selectedEvent && (
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
                  defaultValue={modalMode === 'edit' ? selectedEvent?.title : ''}
                  className="w-full px-3 py-2 rounded-md bg-zinc-800 border border-zinc-600 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  // Ensure selectedEvent/Slot exist before accessing start/end
                  defaultValue={formatForInput(
                      modalMode === 'edit' && selectedEvent ? selectedEvent.start :
                      selectedSlot ? selectedSlot.start : new Date() // Fallback added
                  )}
                  className="w-full px-3 py-2 rounded-md bg-zinc-800 border border-zinc-600 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 calendar-input"
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
                  defaultValue={formatForInput(
                      modalMode === 'edit' && selectedEvent ? selectedEvent.end :
                      selectedSlot ? selectedSlot.end : new Date() // Fallback added
                  )}
                  className="w-full px-3 py-2 rounded-md bg-zinc-800 border border-zinc-600 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 calendar-input"
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
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-medium transition-colors"
                >
                  {submitButtonText}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
