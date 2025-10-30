import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"
import { z } from "zod"
import { startOfWeek, addDays, getDay } from "date-fns"

// Helper function to combine date and time
function combineDateAndTime(date: Date, timeString: string): string {
  const [hours, minutes, seconds] = timeString.split(":").map(Number)
  let newDate = new Date(date)
  newDate.setHours(hours, minutes, seconds, 0)
  return newDate.toISOString()
}

const EnrollSchema = z.object({
  course_id: z.coerce.number().int().positive("Invalid Course ID"),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return new NextResponse(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
    })
  }

  const body = await request.json()
  const validatedFields = EnrollSchema.safeParse(body)

  if (!validatedFields.success) {
    return new NextResponse(
      JSON.stringify({
        message: "Invalid course ID provided.",
        errors: validatedFields.error.flatten().fieldErrors,
      }),
      { status: 400 }
    )
  }

  const { course_id } = validatedFields.data

  // Enroll the student
  const { error: enrollError } = await supabase.from("student_courses").insert({
    student_id: user.id,
    course_id: course_id,
  })

  if (enrollError) {
    if (enrollError.code === "23505") {
      return new NextResponse(
        JSON.stringify({ message: "Already enrolled in this course." }),
        { status: 409 }
      )
    }
    return new NextResponse(
      JSON.stringify({ message: "Error enrolling in course." }),
      { status: 500 }
    )
  }

  // Fetch course details
  const { data: courseDetails, error: courseError } = await supabase
    .from("courses")
    .select(
      "course_name, class_start_time, class_end_time, meets_monday, meets_tuesday, meets_wednesday, meets_thursday, meets_friday, meets_saturday, meets_sunday"
    )
    .eq("id", course_id)
    .single()

  if (
    courseError ||
    !courseDetails ||
    !courseDetails.class_start_time ||
    !courseDetails.class_end_time
  ) {
    revalidatePath("/")
    revalidatePath("/schedule")
    return new NextResponse(
      JSON.stringify({
        message: "Enrolled, but failed to add to schedule (missing course data).",
      }),
      { status: 200 }
    )
  }

  // Calculate current & next week's dates and generate events
  const now = new Date()
  const currentWeekStart = startOfWeek(now, { weekStartsOn: 0 }) // Sunday
  const eventsToInsert = []
  const meetingDays = [
    courseDetails.meets_sunday,
    courseDetails.meets_monday,
    courseDetails.meets_tuesday,
    courseDetails.meets_wednesday,
    courseDetails.meets_thursday,
    courseDetails.meets_friday,
    courseDetails.meets_saturday,
  ]

  for (let i = 0; i < 14; i++) {
    const currentDayDate = addDays(currentWeekStart, i)
    const dayOfWeek = getDay(currentDayDate)

    if (meetingDays[dayOfWeek]) {
      try {
        const eventStartTimeISO = combineDateAndTime(
          currentDayDate,
          courseDetails.class_start_time
        )
        const eventEndTimeISO = combineDateAndTime(
          currentDayDate,
          courseDetails.class_end_time
        )

        eventsToInsert.push({
          user_id: user.id,
          course_id: course_id,
          title: courseDetails.course_name || `Course ${course_id}`,
          start_time: eventStartTimeISO,
          end_time: eventEndTimeISO,
        })
      } catch (e) {
        console.error(
          `Error processing date/time for course ${course_id} on day ${i}:`,
          e
        )
      }
    }
  }

  // Insert generated events
  if (eventsToInsert.length > 0) {
    const { error: eventInsertError } = await supabase
      .from("events")
      .insert(eventsToInsert)
    if (eventInsertError) {
      revalidatePath("/")
      revalidatePath("/schedule")
      return new NextResponse(
        JSON.stringify({
          message: "Enrolled, but failed to add some schedule times.",
        }),
        { status: 200 }
      )
    }
  }

  revalidatePath("/")
  revalidatePath("/schedule")
  return new NextResponse(
    JSON.stringify({
      message: "Successfully enrolled and added to schedule!",
    }),
    { status: 200 }
  )
}
