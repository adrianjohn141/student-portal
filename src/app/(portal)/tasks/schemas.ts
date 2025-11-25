import { z } from 'zod'

export const TaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  type: z.enum(['Assignment', 'Quiz', 'Chapter Test', 'Exam', 'Activity']),
  course_id: z.string().optional().or(z.literal('none')),
  due_date: z.string().min(1, 'Due date is required'),
  description: z.string().optional(),
  is_global: z.boolean().optional(),
})

export type TaskFormValues = z.infer<typeof TaskSchema>
