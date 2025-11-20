import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"
import { z } from "zod"

const UnenrollSchema = z.object({
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
  const validatedFields = UnenrollSchema.safeParse(body)

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

  // Unenroll student
  const { error: unenrollError } = await supabase
    .from("student_courses")
    .delete()
    .eq("student_id", user.id)
    .eq("course_id", course_id)

  if (unenrollError) {
    return new NextResponse(
      JSON.stringify({ message: "Error unenrolling from course." }),
      { status: 500 }
    )
  }

  revalidatePath("/")
  revalidatePath("/schedule")
  return new NextResponse(
    JSON.stringify({ message: "Successfully unenrolled!" }),
    { status: 200 }
  )
}
