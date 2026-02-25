'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Award,
    ChevronDown,
    ChevronRight,
    BookOpen,
    TrendingUp,
    Calculator,
    Plus,
    X,
    Users,
    Save
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type CourseGrade = {
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

type GradesBoardProps = {
    initialGrades: CourseGrade[]
    courses: any[]
    userRole: string
}

export default function GradesBoard({ initialGrades, courses, userRole }: GradesBoardProps) {
    const [expandedCourses, setExpandedCourses] = useState<Set<number>>(new Set())
    const [showAdminPanel, setShowAdminPanel] = useState(false)

    const toggleCourse = (courseId: number) => {
        const newExpanded = new Set(expandedCourses)
        if (newExpanded.has(courseId)) {
            newExpanded.delete(courseId)
        } else {
            newExpanded.add(courseId)
        }
        setExpandedCourses(newExpanded)
    }

    const getGradeColor = (grade: number | null) => {
        if (grade === null) return 'text-zinc-400'
        if (grade >= 90) return 'text-green-400'
        if (grade >= 80) return 'text-blue-400'
        if (grade >= 70) return 'text-yellow-400'
        if (grade >= 60) return 'text-orange-400'
        return 'text-red-400'
    }

    const getGradeBgColor = (grade: number | null) => {
        if (grade === null) return 'bg-zinc-800'
        if (grade >= 90) return 'bg-green-900/30'
        if (grade >= 80) return 'bg-blue-900/30'
        if (grade >= 70) return 'bg-yellow-900/30'
        if (grade >= 60) return 'bg-orange-900/30'
        return 'bg-red-900/30'
    }

    const getLetterGradeColor = (letter: string | null) => {
        if (!letter) return 'text-zinc-400'
        if (letter.startsWith('A')) return 'text-green-400'
        if (letter.startsWith('B')) return 'text-blue-400'
        if (letter.startsWith('C')) return 'text-yellow-400'
        if (letter.startsWith('D')) return 'text-orange-400'
        return 'text-red-400'
    }

    // Calculate overall GPA
    const totalCourses = initialGrades.filter(g => g.overall_grade !== null).length
    const averageGrade = totalCourses > 0
        ? initialGrades.reduce((sum, g) => sum + (g.overall_grade || 0), 0) / totalCourses
        : null

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Award className="text-yellow-400" size={32} />
                        My Grades
                    </h1>
                    <p className="text-zinc-400 mt-1">
                        Track your academic progress across all courses
                    </p>
                </div>
                {userRole === 'admin' && (
                    <button
                        onClick={() => setShowAdminPanel(!showAdminPanel)}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                    >
                        <Calculator size={18} />
                        {showAdminPanel ? 'Hide Admin' : 'Admin Panel'}
                    </button>
                )}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-black/30 border border-white/20 backdrop-blur-lg p-4 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-600/20 rounded-lg">
                            <TrendingUp className="text-yellow-400" size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-zinc-400">Average Grade</p>
                            <p className={`text-2xl font-bold ${getGradeColor(averageGrade)}`}>
                                {averageGrade !== null ? `${averageGrade.toFixed(1)}%` : 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-black/30 border border-white/20 backdrop-blur-lg p-4 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600/20 rounded-lg">
                            <BookOpen className="text-blue-400" size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-zinc-400">Enrolled Courses</p>
                            <p className="text-2xl font-bold text-white">
                                {courses.length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-black/30 border border-white/20 backdrop-blur-lg p-4 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-600/20 rounded-lg">
                            <Award className="text-green-400" size={20} />
                        </div>
                        <div>
                            <p className="text-sm text-zinc-400">Graded Courses</p>
                            <p className="text-2xl font-bold text-white">
                                {totalCourses}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Admin Panel */}
            <AnimatePresence>
                {showAdminPanel && userRole === 'admin' && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-black/30 border border-purple-500/30 backdrop-blur-lg p-4 rounded-lg"
                    >
                        <AdminPanel courses={courses} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Course Grades List */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold border-b border-zinc-700 pb-2">
                    Course Grades
                </h2>

                {initialGrades.length > 0 ? (
                    initialGrades.map((grade) => (
                        <motion.div
                            key={grade.course_id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`bg-black/30 border border-white/20 backdrop-blur-lg rounded-lg overflow-hidden ${getGradeBgColor(grade.overall_grade)}`}
                        >
                            <button
                                onClick={() => toggleCourse(grade.course_id)}
                                className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    {expandedCourses.has(grade.course_id) ? (
                                        <ChevronDown size={20} className="text-zinc-400" />
                                    ) : (
                                        <ChevronRight size={20} className="text-zinc-400" />
                                    )}
                                    <div className="text-left">
                                        <h3 className="font-semibold text-lg">
                                            {grade.course_name}
                                        </h3>
                                        <p className="text-sm text-zinc-400">
                                            {grade.course_code} • {grade.instructor}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`text-3xl font-bold ${getLetterGradeColor(grade.letter_grade)}`}>
                                        {grade.letter_grade || 'N/A'}
                                    </p>
                                    <p className={`text-sm ${getGradeColor(grade.overall_grade)}`}>
                                        {grade.overall_grade !== null
                                            ? `${grade.overall_grade.toFixed(1)}%`
                                            : 'No grades yet'}
                                    </p>
                                </div>
                            </button>

                            <AnimatePresence>
                                {expandedCourses.has(grade.course_id) && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="border-t border-white/10"
                                    >
                                        <div className="p-4 space-y-4">
                                            {grade.categories.length > 0 ? (
                                                grade.categories.map((category) => {
                                                    const gradedItems = category.items.filter(i => i.is_graded)
                                                    const categoryPercent = gradedItems.length > 0
                                                        ? (gradedItems.reduce((sum, i) => sum + (i.points_earned || 0), 0) /
                                                            gradedItems.reduce((sum, i) => sum + i.max_points, 0)) * 100
                                                        : null

                                                    return (
                                                        <div key={category.id} className="bg-black/20 rounded-lg p-3">
                                                            <div className="flex items-center justify-between mb-3">
                                                                <div>
                                                                    <h4 className="font-medium">{category.name}</h4>
                                                                    <p className="text-xs text-zinc-400">
                                                                        Weight: {category.weight}%
                                                                    </p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className={`font-semibold ${getGradeColor(categoryPercent)}`}>
                                                                        {categoryPercent !== null
                                                                            ? `${categoryPercent.toFixed(1)}%`
                                                                            : 'No grades'}
                                                                    </p>
                                                                    <p className="text-xs text-zinc-400">
                                                                        {gradedItems.length}/{category.items.length} graded
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            {/* Grade Items */}
                                                            <div className="space-y-2">
                                                                {category.items.map((item) => (
                                                                    <div
                                                                        key={item.id}
                                                                        className="flex items-center justify-between text-sm bg-white/5 rounded px-3 py-2"
                                                                    >
                                                                        <div>
                                                                            <span className={item.is_graded ? 'text-white' : 'text-zinc-400'}>
                                                                                {item.name}
                                                                            </span>
                                                                            {item.due_date && (
                                                                                <span className="text-zinc-500 text-xs ml-2">
                                                                                    Due: {new Date(item.due_date).toLocaleDateString()}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            {item.is_graded ? (
                                                                                <>
                                                                                    <span className={getGradeColor((item.points_earned! / item.max_points) * 100)}>
                                                                                        {item.points_earned}/{item.max_points}
                                                                                    </span>
                                                                                    <span className={`font-medium ${getGradeColor((item.points_earned! / item.max_points) * 100)}`}>
                                                                                        ({((item.points_earned! / item.max_points) * 100).toFixed(0)}%)
                                                                                    </span>
                                                                                </>
                                                                            ) : (
                                                                                <span className="text-zinc-500">Not graded</span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )
                                                })
                                            ) : (
                                                <p className="text-zinc-400 text-center py-4">
                                                    No grade categories have been set up for this course yet.
                                                </p>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))
                ) : (
                    <div className="text-center py-12 bg-black/20 border border-white/10 rounded-lg">
                        <Award className="mx-auto text-zinc-600 mb-4" size={48} />
                        <p className="text-zinc-400">You are not enrolled in any courses yet.</p>
                        <Link
                            href="/courses"
                            className="inline-block mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                        >
                            Browse Courses
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}

// Admin Panel Component
function AdminPanel({ courses }: { courses: any[] }) {
    const [activeTab, setActiveTab] = useState<'category' | 'item' | 'grades'>('category')
    const [selectedCourse, setSelectedCourse] = useState<number | null>(null)
    const [categoryName, setCategoryName] = useState('')
    const [categoryWeight, setCategoryWeight] = useState('')
    const [itemName, setItemName] = useState('')
    const [itemMaxPoints, setItemMaxPoints] = useState('100')
    const [itemDueDate, setItemDueDate] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
    const [message, setMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [categories, setCategories] = useState<any[]>([])

    // Grade Students tab state
    const [students, setStudents] = useState<any[]>([])
    const [gradeItems, setGradeItems] = useState<any[]>([])
    const [studentGrades, setStudentGrades] = useState<{ [key: string]: number | null }>({})
    const [isSaving, setIsSaving] = useState(false)

    // New: Selected category and grade item for grading
    const [selectedGradeCategory, setSelectedGradeCategory] = useState<number | null>(null)
    const [selectedGradeItem, setSelectedGradeItem] = useState<number | null>(null)
    const [gradingItems, setGradingItems] = useState<any[]>([])

    const router = useRouter()

    // Fetch categories when course is selected
    useEffect(() => {
        const fetchCategories = async () => {
            if (!selectedCourse) {
                setCategories([])
                return
            }

            const supabase = createClient()
            const { data, error } = await supabase
                .from('grade_categories')
                .select('*')
                .eq('course_id', selectedCourse)
                .order('name')

            if (!error && data) {
                setCategories(data)
            }
        }

        fetchCategories()
    }, [selectedCourse])

    // Fetch grade items when category is selected for grading
    useEffect(() => {
        const fetchGradeItems = async () => {
            if (!selectedGradeCategory) {
                setGradingItems([])
                return
            }

            const supabase = createClient()
            const { data } = await supabase
                .from('grade_items')
                .select('id, category_id, name, max_points')
                .eq('category_id', selectedGradeCategory)
                .order('name')

            if (data) {
                setGradingItems(data)
            }
        }

        fetchGradeItems()
    }, [selectedGradeCategory])

    // Fetch students and grades when grade item is selected
    useEffect(() => {
        const fetchStudentsAndGrades = async () => {
            if (!selectedCourse || !selectedGradeItem) {
                setStudents([])
                setStudentGrades({})
                return
            }

            const supabase = createClient()

            // Fetch enrolled students
            const { data: studentData } = await supabase
                .from('student_courses')
                .select('profiles(id, full_name, email)')
                .eq('course_id', selectedCourse)

            const enrolledStudents = studentData?.map(s => s.profiles).filter(Boolean) || []

            // Fetch existing grades for this specific item
            const studentIds = enrolledStudents.map((s: any) => s.id)

            let existingGrades: any[] = []
            if (studentIds.length > 0) {
                const { data: gradesData } = await supabase
                    .from('grades')
                    .select('student_id, grade_item_id, points_earned')
                    .eq('grade_item_id', selectedGradeItem)
                    .in('student_id', studentIds)

                existingGrades = gradesData || []
            }

            // Build grade map
            const gradeMap: { [key: string]: number | null } = {}
            existingGrades.forEach(g => {
                gradeMap[g.student_id] = g.points_earned
            })

            setStudents(enrolledStudents)
            setStudentGrades(gradeMap)
        }

        fetchStudentsAndGrades()
    }, [selectedCourse, selectedGradeItem])

    const handleCreateCategory = async () => {
        if (!selectedCourse || !categoryName || !categoryWeight) {
            setMessage('Please fill in all fields')
            return
        }

        setIsLoading(true)
        setMessage('')

        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                setMessage('You must be logged in')
                setIsLoading(false)
                return
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()

            if (profile?.role !== 'admin') {
                setMessage('Only admins can create categories')
                setIsLoading(false)
                return
            }

            const { error } = await supabase
                .from('grade_categories')
                .insert({
                    course_id: selectedCourse,
                    name: categoryName,
                    weight: parseFloat(categoryWeight),
                    created_by: user.id
                })

            if (error) {
                setMessage(`Error: ${error.message}`)
            } else {
                setMessage('Category created successfully!')
                setCategoryName('')
                setCategoryWeight('')
                router.refresh()
            }
        } catch (err: any) {
            setMessage(`Error: ${err.message}`)
        }

        setIsLoading(false)
    }

    const handleCreateItem = async () => {
        if (!selectedCategory || !itemName || !itemMaxPoints) {
            setMessage('Please fill in all fields')
            return
        }

        setIsLoading(true)
        setMessage('')

        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                setMessage('You must be logged in')
                setIsLoading(false)
                return
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()

            if (profile?.role !== 'admin') {
                setMessage('Only admins can create grade items')
                setIsLoading(false)
                return
            }

            const { error } = await supabase
                .from('grade_items')
                .insert({
                    category_id: selectedCategory,
                    name: itemName,
                    max_points: parseFloat(itemMaxPoints),
                    due_date: itemDueDate || null,
                    created_by: user.id,
                    is_global: true
                })

            if (error) {
                setMessage(`Error: ${error.message}`)
            } else {
                setMessage('Grade item created successfully!')
                setItemName('')
                setItemMaxPoints('100')
                setItemDueDate('')
                router.refresh()
            }
        } catch (err: any) {
            setMessage(`Error: ${err.message}`)
        }

        setIsLoading(false)
    }

    const handleGradeChange = (studentId: string, itemId: number, value: string) => {
        const key = `${studentId}-${itemId}`
        const newGrades = { ...studentGrades }
        newGrades[key] = value === '' ? null : parseFloat(value)
        setStudentGrades(newGrades)
    }

    // Save grades for the selected grade item
    const handleSaveGradesForItem = async () => {
        if (!selectedGradeItem) {
            setMessage('Please select a grade item')
            return
        }

        setIsSaving(true)
        setMessage('')

        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                setMessage('You must be logged in')
                setIsSaving(false)
                return
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()

            if (profile?.role !== 'admin') {
                setMessage('Only admins can save grades')
                setIsSaving(false)
                return
            }

            // Save grades for each student
            const gradeEntries = Object.entries(studentGrades)
                .filter(([_, value]) => value !== null)

            let hasErrors = false
            for (const [studentId, value] of gradeEntries) {
                const { error } = await supabase
                    .from('grades')
                    .upsert({
                        student_id: studentId,
                        grade_item_id: selectedGradeItem,
                        points_earned: value,
                        graded_by: user.id,
                        graded_at: new Date().toISOString()
                    }, { onConflict: 'student_id,grade_item_id' })

                if (error) {
                    console.error('Error saving grade:', error.message)
                    hasErrors = true
                }
            }

            if (hasErrors) {
                setMessage('Some grades could not be saved. Check console for details.')
            } else {
                setMessage('Grades saved successfully!')
            }
            router.refresh()
        } catch (err: any) {
            setMessage(`Error: ${err.message}`)
        }

        setIsSaving(false)
    }

    const handleSaveGrades = async () => {
        setIsSaving(true)
        setMessage('')

        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                setMessage('You must be logged in')
                setIsSaving(false)
                return
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()

            if (profile?.role !== 'admin') {
                setMessage('Only admins can save grades')
                setIsSaving(false)
                return
            }

            // Save all grades
            const gradeEntries = Object.entries(studentGrades)
                .filter(([_, value]) => value !== null)

            let hasErrors = false
            for (const [key, value] of gradeEntries) {
                const [studentId, itemIdStr] = key.split('-')
                const itemId = parseInt(itemIdStr)

                const { error } = await supabase
                    .from('grades')
                    .upsert({
                        student_id: studentId,
                        grade_item_id: itemId,
                        points_earned: value,
                        graded_by: user.id,
                        graded_at: new Date().toISOString()
                    }, { onConflict: 'student_id,grade_item_id' })

                if (error) {
                    console.error('Error saving grade:', error.message)
                    hasErrors = true
                }
            }

            if (hasErrors) {
                setMessage('Some grades could not be saved. Check console for details.')
            } else {
                setMessage('Grades saved successfully!')
            }
            router.refresh()
        } catch (err: any) {
            setMessage(`Error: ${err.message}`)
        }

        setIsSaving(false)
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-purple-400">Grade Management</h3>
                {message && (
                    <span className="text-sm text-green-400">{message}</span>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
                <button
                    onClick={() => setActiveTab('category')}
                    className={`px-4 py-2 rounded-lg transition-colors ${activeTab === 'category'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/10 text-zinc-400 hover:bg-white/20'
                        }`}
                >
                    Add Category
                </button>
                <button
                    onClick={() => setActiveTab('item')}
                    className={`px-4 py-2 rounded-lg transition-colors ${activeTab === 'item'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/10 text-zinc-400 hover:bg-white/20'
                        }`}
                >
                    Add Grade Item
                </button>
                <button
                    onClick={() => setActiveTab('grades')}
                    className={`px-4 py-2 rounded-lg transition-colors ${activeTab === 'grades'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/10 text-zinc-400 hover:bg-white/20'
                        }`}
                >
                    Grade Students
                </button>
            </div>

            {/* Course Selection */}
            <div className="mb-4">
                <label className="block text-sm text-zinc-400 mb-1">Select Course</label>
                <select
                    value={selectedCourse || ''}
                    onChange={(e) => setSelectedCourse(Number(e.target.value))}
                    className="w-full bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-white"
                >
                    <option value="">Select a course...</option>
                    {courses.map((course: any) => (
                        <option key={course.id} value={course.id}>
                            {course.course_code} - {course.course_name}
                        </option>
                    ))}
                </select>
            </div>

            {activeTab === 'category' ? (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Category Name</label>
                        <input
                            type="text"
                            value={categoryName}
                            onChange={(e) => setCategoryName(e.target.value)}
                            placeholder="e.g., Homework, Quizzes, Exams"
                            className="w-full bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Weight (%)</label>
                        <input
                            type="number"
                            value={categoryWeight}
                            onChange={(e) => setCategoryWeight(e.target.value)}
                            placeholder="e.g., 20"
                            className="w-full bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-white"
                        />
                    </div>
                    <button
                        onClick={handleCreateCategory}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <Plus size={18} />
                        Create Category
                    </button>
                </div>
            ) : activeTab === 'item' ? (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Category</label>
                        <select
                            value={selectedCategory || ''}
                            onChange={(e) => setSelectedCategory(Number(e.target.value))}
                            className="w-full bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-white"
                            disabled={categories.length === 0}
                        >
                            <option value="">
                                {selectedCourse ? (categories.length > 0 ? 'Select a category...' : 'No categories yet') : 'Select a course first'}
                            </option>
                            {categories.map((cat: any) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name} ({cat.weight}%)
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Item Name</label>
                        <input
                            type="text"
                            value={itemName}
                            onChange={(e) => setItemName(e.target.value)}
                            placeholder="e.g., Quiz 1, Homework 1"
                            className="w-full bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-white"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-zinc-400 mb-1">Max Points</label>
                            <input
                                type="number"
                                value={itemMaxPoints}
                                onChange={(e) => setItemMaxPoints(e.target.value)}
                                className="w-full bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-zinc-400 mb-1">Due Date (Optional)</label>
                            <input
                                type="date"
                                value={itemDueDate}
                                onChange={(e) => setItemDueDate(e.target.value)}
                                className="w-full bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-white"
                            />
                        </div>
                    </div>
                    <button
                        onClick={handleCreateItem}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <Plus size={18} />
                        Create Grade Item
                    </button>
                </div>
            ) : (
                // Grade Students Tab - New workflow: Select Category -> Select Item -> Grade Students
                <div className="space-y-4">
                    {/* Category Selection */}
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Select Category</label>
                        <select
                            value={selectedGradeCategory || ''}
                            onChange={(e) => {
                                setSelectedGradeCategory(Number(e.target.value))
                                setSelectedGradeItem(null)
                            }}
                            className="w-full bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-white"
                            disabled={categories.length === 0}
                        >
                            <option value="">
                                {selectedCourse ? (categories.length > 0 ? 'Select a category...' : 'No categories yet') : 'Select a course first'}
                            </option>
                            {categories.map((cat: any) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name} ({cat.weight}%)
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Grade Item Selection */}
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Select Grade Item</label>
                        <select
                            value={selectedGradeItem || ''}
                            onChange={(e) => setSelectedGradeItem(Number(e.target.value))}
                            className="w-full bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-white"
                            disabled={gradingItems.length === 0}
                        >
                            <option value="">
                                {selectedGradeCategory ? (gradingItems.length > 0 ? 'Select an item...' : 'No items in this category') : 'Select a category first'}
                            </option>
                            {gradingItems.map((item: any) => (
                                <option key={item.id} value={item.id}>
                                    {item.name} ({item.max_points} pts)
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Students Grading Table */}
                    {selectedGradeItem && selectedCourse ? (
                        students.length > 0 ? (
                            <>
                                <div className="bg-black/20 rounded-lg p-4">
                                    <h4 className="text-sm font-medium text-zinc-400 mb-3">
                                        Grade: {gradingItems.find(i => i.id === selectedGradeItem)?.name}
                                        <span className="ml-2 text-xs">
                                            (Max: {gradingItems.find(i => i.id === selectedGradeItem)?.max_points} pts)
                                        </span>
                                    </h4>
                                    <div className="space-y-2">
                                        {students.map((student: any) => {
                                            const currentValue = studentGrades[student.id] ?? ''
                                            return (
                                                <div key={student.id} className="flex items-center justify-between bg-white/5 rounded px-3 py-2">
                                                    <span className="text-white">
                                                        {student.full_name || student.email}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max={gradingItems.find(i => i.id === selectedGradeItem)?.max_points || 100}
                                                            value={currentValue}
                                                            onChange={(e) => {
                                                                const newGrades = { ...studentGrades }
                                                                newGrades[student.id] = e.target.value === '' ? null : parseFloat(e.target.value)
                                                                setStudentGrades(newGrades)
                                                            }}
                                                            placeholder="-"
                                                            className="w-20 bg-black/50 border border-white/20 rounded px-2 py-1 text-white text-center"
                                                        />
                                                        <span className="text-zinc-500 text-sm">
                                                            / {gradingItems.find(i => i.id === selectedGradeItem)?.max_points}
                                                        </span>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                                <button
                                    onClick={handleSaveGradesForItem}
                                    disabled={isSaving}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    <Save size={18} />
                                    {isSaving ? 'Saving...' : 'Save Grades'}
                                </button>
                            </>
                        ) : (
                            <p className="text-zinc-400 text-center py-4">No students enrolled in this course.</p>
                        )
                    ) : !selectedGradeCategory ? (
                        <p className="text-zinc-400 text-center py-4">Select a category to see grade items.</p>
                    ) : !selectedGradeItem ? (
                        <p className="text-zinc-400 text-center py-4">Select a grade item to grade students.</p>
                    ) : null}
                </div>
            )}
        </div>
    )
}
