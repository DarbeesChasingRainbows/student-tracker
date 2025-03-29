import { CommandHandler } from "../../core/CommandHandler.ts";
import { UpdateStudentCommand } from "./UpdateStudentCommand.ts";
import { Student, createStudent } from "../../../../domain/models/Student.ts";
import { StudentRepository } from "../../../../ports/repositories/StudentRepository.ts";

/**
 * Handler for the UpdateStudentCommand
 */
export class UpdateStudentCommandHandler implements CommandHandler<UpdateStudentCommand, Student> {
  constructor(private studentRepository: StudentRepository) {}

  /**
   * Execute the command to update an existing student
   * @param command The command containing updated student data
   * @returns The updated student
   * @throws Error if the student is not found
   */
  async execute(command: UpdateStudentCommand): Promise<Student> {
    // Check if the student exists
    const existingStudent = await this.studentRepository.findById(command.id);
    if (!existingStudent) {
      throw new Error(`Student with ID ${command.id} not found`);
    }

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

    // Add the ID to the student data
    const studentToUpdate = {
      ...studentData,
      id: command.id
    };

    // Save the updated student using the repository
    return await this.studentRepository.save(studentToUpdate);
  }
}
