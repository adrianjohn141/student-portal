"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter, useSearchParams } from "next/navigation"
import { Book, PlusCircle, MinusCircle, Clock } from "lucide-react"
import { format, parse } from "date-fns"
import { formatInTimeZone } from "date-fns-tz"
import { motion, AnimatePresence } from "framer-motion"
import type { User } from "@supabase/supabase-js"
import eventBus from "@/lib/eventBus"

type Course = {
  id: number
  course_code: string | null
  course_name: string | null
  instructor: string | null
  class_start_time: string | null
  class_end_time: string | null
}

function formatClassTime(timeString: string | null): string | null {
  if (!timeString) return null
  try {
    // The time from the DB is just "HH:mm:ss". We need to parse it into a date object.
    // We'll use a dummy date (like the Unix epoch) since the date part is irrelevant.
    const time = parse(timeString, "HH:mm:ss", new Date(0))
    // Now, format that time in the 'Asia/Manila' timezone.
    return formatInTimeZone(time, "Asia/Manila", "h:mm a")
  } catch (e) {
    console.error("Error formatting time:", e)
    return timeString
  }
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([])
  const [availableCourses, setAvailableCourses] = useState<Course[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const successMessage = searchParams.get("message")
    if (successMessage) {
      setMessage(successMessage)
    }
  }, [searchParams])

  useEffect(() => {
    const fetchInitialData = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }
      setUser(user)

      const { data: allCourses } = await supabase
        .from("courses")
        .select(
          "id, course_code, course_name, instructor, class_start_time, class_end_time"
        )
        .order("course_code")

      const { data: studentCoursesData } = await supabase
        .from("student_courses")
        .select("courses (id, course_code, course_name, instructor, class_start_time, class_end_time)")
        .eq("student_id", user.id)

      const enrolled =
        studentCoursesData
          ?.map(sc => {
            if (
              sc.courses &&
              typeof sc.courses === "object" &&
              !Array.isArray(sc.courses)
            ) {
              return sc.courses as Course
            }
            return null
          })
          .filter((c): c is Course => c !== null)
          .sort((a, b) =>
            (a.course_code || "").localeCompare(b.course_code || "")
          ) || []

      const enrolledIds = new Set(enrolled.map(c => c.id))
      const available =
        allCourses?.filter(c => !enrolledIds.has(c.id)) || []

      setEnrolledCourses(enrolled)
      setAvailableCourses(available)
      setIsLoading(false)
    }

    fetchInitialData()
  }, [router])

  const handleEnroll = async (course: Course) => {
    setAvailableCourses(prev => prev.filter(c => c.id !== course.id))
    setEnrolledCourses(prev => [...prev, course].sort((a, b) => (a.course_code || "").localeCompare(b.course_code || "")))

    const response = await fetch("/api/enroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ course_id: course.id }),
    })

    const result = await response.json()
    setMessage(result.message)

    if (!response.ok) {
      setEnrolledCourses(prev => prev.filter(c => c.id !== course.id))
      setAvailableCourses(prev => [...prev, course].sort((a, b) => (a.course_code || "").localeCompare(b.course_code || "")))
    } else {
      eventBus.emit("course-changed")
    }
  }

  const handleUnenroll = async (course: Course) => {
    setEnrolledCourses(prev => prev.filter(c => c.id !== course.id))
    setAvailableCourses(prev => [...prev, course].sort((a, b) => (a.course_code || "").localeCompare(b.course_code || "")))

    const response = await fetch("/api/unenroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ course_id: course.id }),
    })

    const result = await response.json()
    setMessage(result.message)

    if (!response.ok) {
      setAvailableCourses(prev => prev.filter(c => c.id !== course.id))
      setEnrolledCourses(prev => [...prev, course].sort((a, b) => (a.course_code || "").localeCompare(b.course_code || "")))
    } else {
      eventBus.emit("course-changed")
    }
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold">My Courses</h1>

      {message && (
        <p
          className={`mb-4 p-3 rounded-md text-center text-sm ${
            message.startsWith("Error")
              ? "bg-red-900 text-red-100"
              : "bg-green-900 text-green-100"
          }`}
        >
          {message}
        </p>
      )}

      <section>
        <h2 className="text-2xl font-semibold mb-4 border-b border-zinc-700 pb-2">
          Enrolled Courses
        </h2>
        <div className="flex flex-col gap-4">
          <AnimatePresence>
            {enrolledCourses.length > 0 ? (
              enrolledCourses.map(course => (
                <CourseCard
                  key={`enrolled-${course.id}`}
                  course={course}
                  action="unenroll"
                  onAction={handleUnenroll}
                />
              ))
            ) : (
              <p className="text-zinc-400 text-sm italic">
                You are not enrolled in any courses yet.
              </p>
            )}
          </AnimatePresence>
        </div>
      </section>

      <div className="my-4 border-t border-zinc-700"></div>

      <section>
        <h2 className="text-2xl font-semibold mb-4 border-b border-zinc-700 pb-2">
          Available Courses
        </h2>
        <div className="flex flex-col gap-4">
          <AnimatePresence>
            {availableCourses.length > 0 ? (
              availableCourses.map(course => (
                <CourseCard
                  key={`available-${course.id}`}
                  course={course}
                  action="enroll"
                  onAction={handleEnroll}
                />
              ))
            ) : (
              <p className="text-zinc-400 text-sm italic">
                No other courses available to enroll in.
              </p>
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  )
}

function CourseCard({
  course,
  action,
  onAction,
}: {
  course: Course
  action: "enroll" | "unenroll"
  onAction: (course: Course) => void
}) {
  const startTimeFormatted = formatClassTime(course.class_start_time)
  const endTimeFormatted = formatClassTime(course.class_end_time)
  const timeDisplay =
    startTimeFormatted && endTimeFormatted
      ? `${startTimeFormatted} - ${endTimeFormatted}`
      : startTimeFormatted || "Time not specified"

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={`bg-black/30 border border-white/20 backdrop-blur-lg p-4 rounded-lg flex items-center justify-between gap-4`}
    >
      <div className="flex items-center gap-4">
        <div className="p-2 bg-blue-600/20 rounded-lg">
          <Book className="text-blue-400" size={20} />
        </div>
        <div className="flex flex-col">
          <h3 className="font-semibold">{course.course_name}</h3>
          <p className="text-sm text-zinc-200">
            {course.course_code} - {course.instructor}
          </p>
          {course.class_start_time && (
            <p className="text-xs text-zinc-400 flex items-center gap-1 mt-1">
              <Clock size={12} /> {timeDisplay}
            </p>
          )}
        </div>
      </div>
      <button
        onClick={() => onAction(course)}
        className={`flex items-center gap-1 px-3 py-1 text-sm text-white rounded-md transition-colors whitespace-nowrap ${
          action === "enroll"
            ? "bg-green-600 hover:bg-green-700"
            : "bg-red-600 hover:bg-red-700"
        }`}
        aria-label={`${
          action === "enroll" ? "Enroll in" : "Unenroll from"
        } ${course.course_name}`}
      >
        {action === "enroll" ? (
          <PlusCircle size={14} />
        ) : (
          <MinusCircle size={14} />
        )}
        {action === "enroll" ? "Enroll" : "Unenroll"}
      </button>
    </motion.div>
  )
}
