import { z } from "zod";

// Assignment types
export enum AssignmentType {
  HOMEWORK = "homework",
  QUIZ = "quiz",
  TEST = "test",
}

// Difficulty levels
export enum DifficultyLevel {
  EASY = "easy",
  MEDIUM = "medium",
  HARD = "hard",
}

// Assignment status
export enum AssignmentStatus {
  DRAFT = "draft",
  ASSIGNED = "assigned",
  COMPLETED = "completed", 
  GRADED = "graded",
}

// Assignment settings for retakes and confetti
export const AssignmentSettingsSchema = z.object({
  allowRetake: z.boolean().default(false),
  allowQuestionRetry: z.boolean().default(false),
  confettiThreshold: z.number().min(0).max(100).default(80), // Percentage score that triggers confetti
  confettiOnCorrectAnswer: z.boolean().default(false),
  adaptiveReassignThreshold: z.number().min(0).max(100).default(80), // Below this score, generate a new adaptive assignment
  adaptiveLearningEnabled: z.boolean().default(false),
});

export type AssignmentSettings = z.infer<typeof AssignmentSettingsSchema>;

// Assignment entity schema
export const AssignmentSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  type: z.nativeEnum(AssignmentType),
  questionIds: z.array(z.string().uuid()),
  createdBy: z.string().uuid(), // Admin/Teacher ID
  status: z.nativeEnum(AssignmentStatus).default(AssignmentStatus.DRAFT),
  settings: AssignmentSettingsSchema,
  dueDate: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  completedCount: z.number().optional(),
  assignedStudents: z.number().optional(),
  averageScore: z.number().optional(),
});

export type Assignment = z.infer<typeof AssignmentSchema>;

// Factory function to create a new assignment
export function createAssignment(
  title: string,
  type: AssignmentType,
  questionIds: string[],
  createdBy: string,
  description?: string,
  settings?: Partial<AssignmentSettings>,
  dueDate?: Date,
): Omit<Assignment, "id" | "status" | "createdAt" | "updatedAt"> {
  return {
    title,
    type,
    questionIds,
    createdBy,
    description,
    settings: AssignmentSettingsSchema.parse({
      ...AssignmentSettingsSchema.parse({}), // Default settings
      ...settings,
    }),
    dueDate,
  };
}
