import { z } from "zod";

// Student entity schema definition
export const StudentSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  name: z.string().min(1, "Name is required"),
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .regex(/^[a-zA-Z0-9_.]+$/, "Username can only contain letters, numbers, underscores, and periods"),
  grade: z.string().min(1, "Grade is required"),
  avatarId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  email: z.string().email().optional().nullable(),
  pin: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  assignmentsCompleted: z.number().default(0),
  averageScore: z.number().default(0),
  lastActive: z.date().default(() => new Date()),
});

// Student type definition derived from the schema
export type Student = z.infer<typeof StudentSchema>;

// Factory function to create a new student entity
export function createStudent(
  firstName: string,
  lastName: string,
  grade: string,
  username: string,
  avatarId: string,
  options: {
    email?: string;
    pin?: string;
    notes?: string;
  } = {},
): Omit<Student, "id" | "createdAt" | "updatedAt"> {
  const { email, pin, notes } = options;
  const name = `${firstName} ${lastName}`;
  
  return {
    firstName,
    lastName,
    name,
    username,
    grade,
    avatarId,
    email: email || null,
    pin: pin || null,
    notes: notes || null,
    assignmentsCompleted: 0,
    averageScore: 0,
    lastActive: new Date(),
  };
}
