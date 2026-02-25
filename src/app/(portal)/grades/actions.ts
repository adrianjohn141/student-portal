'use server'

import { createClient } from '@/lib/supabase/server'

export type GradeCategory = {
    id: number
    course_id: number
    name: string
    weight: number
    created_at: string
}

export type GradeItem = {
    id: number
    category_id: number
    name: string
    description: string | null
    max_points: number
    due_date: string | null
    is_global: boolean
    created_at: string
    category?: GradeCategory
}

export type Grade = {
    id: number
    student_id: string
    grade_item_id: number
    points_earned: number | null
    feedback: string | null
    graded_by: string | null
    graded_at: string | null
    created_at: string
    grade_item?: GradeItem
}

export type CourseGrade = {
    course_id: number
    course_code: string
    course_name: string
    instructor: string
    categories: {
        id: number
        name: string
        weight: number
        items: {
            id: number
            name: string
            max_points: number
            points_earned: number | null
            due_date: string | null
            is_graded: boolean
        }[]
        total_weight: number
        earned_weight: number
    }[]
    overall_grade: number | null
    letter_grade: string | null
}

export async function getEnrolledCourses() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) return []

    const { data: studentCourses } = await supabase
        .from('student_courses')
        .select('courses(id, course_code, course_name, instructor)')
        .eq('student_id', user.id)

    return studentCourses?.map((sc) => sc.courses).filter(Boolean) || []
}

export async function getCourseGrades(courseId: number): Promise<CourseGrade | null> {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    // Get course info
    const { data: course } = await supabase
        .from('courses')
        .select('id, course_code, course_name, instructor')
        .eq('id', courseId)
        .single()

    if (!course) return null

    // Get grade categories for this course
    const { data: categories } = await supabase
        .from('grade_categories')
        .select('*')
        .eq('course_id', courseId)
        .order('name')

    if (!categories || categories.length === 0) {
        return {
            course_id: course.id,
            course_code: course.course_code || '',
            course_name: course.course_name || '',
            instructor: course.instructor || '',
            categories: [],
            overall_grade: null,
            letter_grade: null,
        }
    }

    // Get grade items for each category
    const categoryIds = categories.map((c) => c.id)
    const { data: gradeItems } = await supabase
        .from('grade_items')
        .select('*')
        .in('category_id', categoryIds)
        .order('due_date', { ascending: true })

    // Get user's grades
    const itemIds = gradeItems?.map((i) => i.id) || []
    const { data: grades } = await supabase
        .from('grades')
        .select('*')
        .eq('student_id', user.id)
        .in('grade_item_id', itemIds)

    // Build the grade structure
    const gradeMap = new Map(grades?.map((g) => [g.grade_item_id, g]))

    const categoriesWithItems = categories.map((cat) => {
        const items = gradeItems
            ?.filter((item) => item.category_id === cat.id)
            .map((item) => {
                const grade = gradeMap.get(item.id)
                return {
                    id: item.id,
                    name: item.name,
                    max_points: item.max_points,
                    points_earned: grade?.points_earned ?? null,
                    due_date: item.due_date,
                    is_graded: grade?.points_earned !== null,
                }
            }) || []

        // Calculate category average
        const gradedItems = items.filter((i) => i.is_graded)
        const totalWeight = cat.weight
        let earnedWeight = 0

        if (gradedItems.length > 0) {
            const categoryTotal = gradedItems.reduce(
                (sum, i) => sum + (i.points_earned || 0),
                0
            )
            const categoryMax = gradedItems.reduce((sum, i) => sum + i.max_points, 0)
            const percentage = categoryMax > 0 ? (categoryTotal / categoryMax) * 100 : 0
            earnedWeight = (percentage * totalWeight) / 100
        }

        return {
            id: cat.id,
            name: cat.name,
            weight: cat.weight,
            items,
            total_weight: totalWeight,
            earned_weight: earnedWeight,
        }
    })

    // Calculate overall grade
    const totalWeight = categoriesWithItems.reduce((sum, c) => sum + c.total_weight, 0)
    const totalEarned = categoriesWithItems.reduce((sum, c) => sum + c.earned_weight, 0)
    const overallGrade = totalWeight > 0 ? (totalEarned / totalWeight) * 100 : null

    return {
        course_id: course.id,
        course_code: course.course_code || '',
        course_name: course.course_name || '',
        instructor: course.instructor || '',
        categories: categoriesWithItems,
        overall_grade: overallGrade,
        letter_grade: overallGrade !== null ? getLetterGrade(overallGrade) : null,
    }
}

export async function getAllCourseGrades() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) return []

    // Get enrolled courses
    const { data: studentCourses } = await supabase
        .from('student_courses')
        .select('courses(id, course_code, course_name, instructor)')
        .eq('student_id', user.id)

    const courses = studentCourses?.map((sc) => sc.courses).filter(Boolean) || []

    // Get grades for each course
    const gradesPromises = courses.map(async (course: any) => {
        return getCourseGrades(course.id)
    })

    const grades = await Promise.all(gradesPromises)
    return grades.filter(Boolean)
}

export async function getUserRole() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) return 'student'

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    return profile?.role || 'student'
}

// Admin functions
export async function createGradeCategory(
    courseId: number,
    name: string,
    weight: number
) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { error: 'Not authenticated' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        return { error: 'Only admins can create grade categories' }
    }

    const { data, error } = await supabase
        .from('grade_categories')
        .insert({
            course_id: courseId,
            name,
            weight,
            created_by: user.id,
        })
        .select()
        .single()

    return { data, error }
}

export async function createGradeItem(
    categoryId: number,
    name: string,
    maxPoints: number,
    dueDate: string | null,
    description: string | null = null
) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { error: 'Not authenticated' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        return { error: 'Only admins can create grade items' }
    }

    const { data, error } = await supabase
        .from('grade_items')
        .insert({
            category_id: categoryId,
            name,
            max_points: maxPoints,
            due_date: dueDate,
            description,
            created_by: user.id,
        })
        .select()
        .single()

    return { data, error }
}

export async function updateGrade(
    studentId: string,
    gradeItemId: number,
    pointsEarned: number | null,
    feedback: string | null = null
) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { error: 'Not authenticated' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        return { error: 'Only admins can update grades' }
    }

    const { data, error } = await supabase
        .from('grades')
        .upsert(
            {
                student_id: studentId,
                grade_item_id: gradeItemId,
                points_earned: pointsEarned,
                feedback,
                graded_by: user.id,
                graded_at: pointsEarned !== null ? new Date().toISOString() : null,
            },
            { onConflict: 'student_id,grade_item_id' }
        )
        .select()
        .single()

    return { data, error }
}

function getLetterGrade(percentage: number): string {
    if (percentage >= 97) return 'A+'
    if (percentage >= 93) return 'A'
    if (percentage >= 90) return 'A-'
    if (percentage >= 87) return 'B+'
    if (percentage >= 83) return 'B'
    if (percentage >= 80) return 'B-'
    if (percentage >= 77) return 'C+'
    if (percentage >= 73) return 'C'
    if (percentage >= 70) return 'C-'
    if (percentage >= 60) return 'D'
    return 'F'
}
