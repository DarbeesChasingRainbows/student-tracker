import { CommandHandler } from "../../core/CommandHandler.ts";
import { DeleteStudentCommand } from "./DeleteStudentCommand.ts";
import { StudentRepository } from "../../../../ports/repositories/StudentRepository.ts";

/**
 * Handler for the DeleteStudentCommand
 */
export class DeleteStudentCommandHandler implements CommandHandler<DeleteStudentCommand, boolean> {
  constructor(private studentRepository: StudentRepository) {}

  /**
   * Execute the command to delete a student
   * @param command The command containing the student ID to delete
   * @returns True if the student was deleted, false otherwise
   */
  async execute(command: DeleteStudentCommand): Promise<boolean> {
    // Check if the student exists
    const existingStudent = await this.studentRepository.findById(command.id);
    if (!existingStudent) {
      throw new Error(`Student with ID ${command.id} not found`);
    }

    // Delete the student using the repository
    return await this.studentRepository.delete(command.id);
  }
}
