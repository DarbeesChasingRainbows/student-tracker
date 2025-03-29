import { Command } from "../../core/Command.ts";
import { Student } from "../../../../domain/models/Student.ts";

/**
 * Command to update an existing student
 */
export class UpdateStudentCommand implements Command<Student> {
  readonly commandType = "UpdateStudent";

  constructor(
    public readonly id: string,
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
