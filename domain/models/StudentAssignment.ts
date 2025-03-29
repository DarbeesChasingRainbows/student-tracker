import { z } from "zod";

// Student Assignment Status
export enum StudentAssignmentStatus {
  ASSIGNED = "assigned",
  IN_PROGRESS = "in_progress",
  SUBMITTED = "submitted",
  GRADED = "graded",
  REASSIGNED = "reassigned", // For adaptive reassignment
  COMPLETED = "completed",   // Assignment has been completed
  OVERDUE = "overdue"        // Assignment is past due date
}

// Student Assignment entity schema
export const StudentAssignmentSchema = z.object({
  id: z.string().uuid(),
  studentId: z.string().uuid(),
  assignmentId: z.string().uuid(),
  status: z.nativeEnum(StudentAssignmentStatus).default(StudentAssignmentStatus.ASSIGNED),
  score: z.number().min(0).max(100).nullable().optional(), // Percentage score
  startedAt: z.date().optional(),
  submittedAt: z.date().optional(),
  gradedAt: z.date().optional(),
  attempts: z.number().int().nonnegative().default(0), // Number of attempts
  feedback: z.string().optional(),
  isAdaptive: z.boolean().default(false), // Whether this is an adaptive reassignment
  originalAssignmentId: z.string().uuid().optional(), // If adaptive, link to original assignment
  dueDate: z.date().optional(), // When the assignment is due
  completedAt: z.date().nullable().optional(), // When the assignment was completed
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type StudentAssignment = z.infer<typeof StudentAssignmentSchema>;

// Factory function to create a new student assignment
export function createStudentAssignment(
  studentId: string,
  assignmentId: string,
  isAdaptive: boolean = false,
  originalAssignmentId?: string,
): Omit<StudentAssignment, "id" | "createdAt" | "updatedAt"> {
  return {
    studentId,
    assignmentId,
    status: StudentAssignmentStatus.ASSIGNED,
    attempts: 0,
    isAdaptive,
    originalAssignmentId,
  };
}
