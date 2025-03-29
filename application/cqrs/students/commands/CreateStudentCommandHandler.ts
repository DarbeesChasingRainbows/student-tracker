import { CommandHandler } from "../../core/CommandHandler.ts";
import { CreateStudentCommand } from "./CreateStudentCommand.ts";
import { Student, createStudent } from "../../../../domain/models/Student.ts";
import { StudentRepository } from "../../../../ports/repositories/StudentRepository.ts";

/**
 * Handler for the CreateStudentCommand
 */
export class CreateStudentCommandHandler implements CommandHandler<CreateStudentCommand, Student> {
  constructor(private studentRepository: StudentRepository) {}

  /**
   * Execute the command to create a new student
   * @param command The command containing student data
   * @returns The created student
   */
  async execute(command: CreateStudentCommand): Promise<Student> {
    // Use the factory function to create a student with proper structure
    const studentData = createStudent(
      command.firstName,
      command.lastName,
      command.grade,
      command.username,
      command.avatarId,
      {
        email: command.email,
        pin: command.pin,
        guardianName: command.guardianName,
        guardianEmail: command.guardianEmail,
        guardianPhone: command.guardianPhone,
        notes: command.notes
      }
    );

    // Save the student using the repository
    return await this.studentRepository.save(studentData);
  }
}
