import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { enrollCourse, unenrollCourse } from './coursesActions'
import { Book, PlusCircle, MinusCircle, Clock } from 'lucide-react'
import { format, parse } from 'date-fns' // For formatting time

// Define a type for our course data
type Course = {
  id: number;
  course_code: string | null;
  course_name: string | null;
  instructor: string | null;
  class_start_time: string | null;
  class_end_time: string | null; // Added end time field
};

// Helper function to format time (HH:MM:SS -> h:mm a)
function formatClassTime(timeString: string | null): string | null {
    if (!timeString) return null;
    try {
        const time = parse(timeString, 'HH:mm:ss', new Date());
        return format(time, 'h:mm a');
    } catch (e) {
        console.error("Error formatting time:", e);
        return timeString; // Return original if formatting fails
    }
}


export default async function HomePage({
  searchParams,
}: {
  searchParams?: { message?: string }
}) {
  const supabase = await createClient()
  const resolvedParams = await Promise.resolve(searchParams)
  const message = resolvedParams?.message

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return redirect('/login')
  }

  // --- Fetch Data ---
  // 1. Fetch ALL available courses
  const { data: allCourses, error: errorAllCourses } = await supabase
    .from('courses')
    .select('id, course_code, course_name, instructor, class_start_time, class_end_time') // Added end time
    .order('course_code')

  // 2. Fetch the student's enrolled courses
  const { data: studentCoursesData, error: errorStudentCourses } = await supabase
    .from('student_courses')
    .select(
      `
      course_id,
      courses (
        id, course_code, course_name, instructor, class_start_time, class_end_time
      )
    ` // Added end time
    )
    .eq('student_id', user.id)

  if (errorAllCourses) console.error('Error fetching all courses:', errorAllCourses)
  if (errorStudentCourses) console.error('Error fetching student courses:', errorStudentCourses)

  // --- Process Data ---
  const enrolledCourses: Course[] = studentCoursesData
    ?.map(sc => {
        // Safely check if sc.courses is a valid object before casting
        if (sc.courses && typeof sc.courses === 'object' && !Array.isArray(sc.courses)) {
            return sc.courses as Course; // Cast only if it's a single object
        }
        return null; // Return null otherwise
    })
    .filter((course): course is Course => course !== null) // Filter out any nulls
    .sort((a, b) => (a.course_code || '').localeCompare(b.course_code || '')) || []; // Sort remaining courses

  const enrolledCourseIds = new Set(enrolledCourses.map(c => c.id))

  const availableCourses: Course[] = allCourses
    ?.filter((course): course is Course => course !== null && !enrolledCourseIds.has(course.id)) || []


  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold">My Courses</h1>

      {/* Display Success/Error Messages */}
      {message && (
        <p className={`mb-4 p-3 rounded-md text-center text-sm ${message.startsWith('Error') ? 'bg-red-900 text-red-100' : 'bg-green-900 text-green-100'}`}>
          {message}
        </p>
      )}

      {/* --- Enrolled Courses Section --- */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 border-b border-zinc-700 pb-2">Enrolled Courses</h2>
        <div className="flex flex-col gap-4">
          {enrolledCourses.length > 0 ? (
            enrolledCourses.map((course) => {
              const startTimeFormatted = formatClassTime(course.class_start_time);
              const endTimeFormatted = formatClassTime(course.class_end_time);
              const timeDisplay = startTimeFormatted && endTimeFormatted
                                  ? `${startTimeFormatted} - ${endTimeFormatted}`
                                  : startTimeFormatted || 'Time not specified';

              return (
                <div
                  key={`enrolled-${course.id}`}
                  className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                     <div className="p-2 bg-blue-600/20 rounded-lg">
                        <Book className="text-blue-400" size={20} />
                     </div>
                     <div className="flex flex-col">
                       <h3 className="font-semibold">{course.course_name}</h3>
                       <p className="text-sm text-zinc-400">
                         {course.course_code} - {course.instructor}
                       </p>
                       {/* Display formatted time range */}
                       {course.class_start_time && (
                          <p className="text-xs text-zinc-500 flex items-center gap-1 mt-1">
                              <Clock size={12} /> {timeDisplay}
                          </p>
                       )}
                     </div>
                  </div>
                  {/* Unenroll Button */}
                  <form action={unenrollCourse}>
                    <input type="hidden" name="course_id" value={course.id} />
                    <button
                      type="submit"
                      className="flex items-center gap-1 px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors whitespace-nowrap"
                      aria-label={`Unenroll from ${course.course_name}`}
                    >
                      <MinusCircle size={14} /> Unenroll
                    </button>
                  </form>
                </div>
              );
            })
          ) : (
            <p className="text-zinc-400 text-sm italic">You are not enrolled in any courses yet.</p>
          )}
        </div>
      </section>

      <div className="my-4 border-t border-zinc-700"></div> {/* Separator */}

      {/* --- Available Courses Section --- */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 border-b border-zinc-700 pb-2">Available Courses</h2>
        <div className="flex flex-col gap-4">
          {availableCourses.length > 0 ? (
            availableCourses.map((course) => {
               const startTimeFormatted = formatClassTime(course.class_start_time);
               const endTimeFormatted = formatClassTime(course.class_end_time);
               const timeDisplay = startTimeFormatted && endTimeFormatted
                                  ? `${startTimeFormatted} - ${endTimeFormatted}`
                                  : startTimeFormatted || 'Time not specified';

              return (
                <div
                  key={`available-${course.id}`}
                  className="bg-zinc-800/50 border border-zinc-700 p-4 rounded-lg flex items-center justify-between gap-4"
                >
                   <div className="flex items-center gap-4">
                     <div className="p-2 bg-zinc-700 rounded-lg">
                        <Book className="text-zinc-400" size={20} />
                     </div>
                     <div className="flex flex-col">
                       <h3 className="font-semibold text-zinc-200">{course.course_name}</h3>
                       <p className="text-sm text-zinc-400">
                         {course.course_code} - {course.instructor}
                       </p>
                       {/* Display formatted time range */}
                       {course.class_start_time && (
                          <p className="text-xs text-zinc-500 flex items-center gap-1 mt-1">
                              <Clock size={12} /> {timeDisplay}
                          </p>
                       )}
                     </div>
                  </div>
                   {/* Enroll Button */}
                  <form action={enrollCourse}>
                    <input type="hidden" name="course_id" value={course.id} />
                    <button
                      type="submit"
                      className="flex items-center gap-1 px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors whitespace-nowrap"
                      aria-label={`Enroll in ${course.course_name}`}
                    >
                       <PlusCircle size={14} /> Enroll
                    </button>
                  </form>
                </div>
              );
            })
          ) : (
             <p className="text-zinc-400 text-sm italic">No other courses available to enroll in.</p>
          )}
        </div>
      </section>
    </div>
  )
}