import { getAllCourseGrades, getEnrolledCourses, getUserRole } from './actions'
import GradesBoard from './GradesBoard'

export const dynamic = 'force-dynamic'

export default async function GradesPage() {
    const [allGrades, courses, role] = await Promise.all([
        getAllCourseGrades(),
        getEnrolledCourses(),
        getUserRole()
    ])

    // Filter out null grades
    const validGrades = allGrades.filter((g): g is NonNullable<typeof g> => g !== null)

    return (
        <div className="h-[calc(100vh-6rem)]">
            <GradesBoard
                initialGrades={validGrades}
                courses={courses}
                userRole={role}
            />
        </div>
    )
}
