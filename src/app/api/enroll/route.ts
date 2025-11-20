import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"
import { z } from "zod"

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

  revalidatePath("/")
  revalidatePath("/schedule")
  return new NextResponse(
    JSON.stringify({
      message: "Successfully enrolled!",
    }),
    { status: 200 }
  )
}
