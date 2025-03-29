import { Command } from "../../core/Command.ts";
import { Student } from "../../../../domain/models/Student.ts";

/**
 * Command to create a new student
 */
export class CreateStudentCommand implements Command<Student> {
  readonly commandType = "CreateStudent";

  constructor(
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly username: string,
    public readonly grade: string,
    public readonly avatarId: string,
    public readonly email?: string,
    public readonly pin?: string,
    public readonly guardianName?: string,
    public readonly guardianEmail?: string,
    public readonly guardianPhone?: string,
    public readonly notes?: string
  ) {}
}
