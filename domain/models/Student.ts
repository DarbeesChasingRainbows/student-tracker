import { z } from "zod";

// Student entity schema definition
export const StudentSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  name: z.string().min(1, "Name is required").transform((val, ctx) => {
    const firstName = ctx.parent?.firstName;
    const lastName = ctx.parent?.lastName;
    if (!firstName || !lastName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "First name and last name are required to generate name",
      });
      return z.NEVER;
    }
    return `${firstName} ${lastName}`;
  }),
  username: z.string().min(3, "Username must be at least 3 characters").regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  grade: z.string().min(1, "Grade is required"),
  avatarId: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
  email: z.string().email().optional(),
  pin: z.string().optional(),
  guardianName: z.string().optional(),
  guardianEmail: z.string().email().optional(),
  guardianPhone: z.string().optional(),
  notes: z.string().optional(),
  assignmentsCompleted: z.number().optional(),
  averageScore: z.number().optional(),
  lastActive: z.date().optional(),
}).transform(data => ({
  ...data,
  assignmentsCompleted: data.assignmentsCompleted || 0,
  averageScore: data.averageScore || 0,
  lastActive: data.lastActive || new Date(),
}));

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
    guardianName?: string;
    guardianEmail?: string;
    guardianPhone?: string;
    notes?: string;
  } = {},
): Omit<Student, "id" | "createdAt" | "updatedAt"> {
  const { email, pin, guardianName, guardianEmail, guardianPhone, notes } = options;
  const name = `${firstName} ${lastName}`;
  
  return {
    firstName,
    lastName,
    name,
    username,
    grade,
    avatarId,
    ...(email && { email }),
    ...(pin && { pin }),
    ...(guardianName && { guardianName }),
    ...(guardianEmail && { guardianEmail }),
    ...(guardianPhone && { guardianPhone }),
    ...(notes && { notes }),
  };
}
