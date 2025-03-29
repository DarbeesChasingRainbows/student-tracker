import { CommandHandler } from "../../core/CommandHandler.ts";
import { DeleteAssignmentCommand } from "./DeleteAssignmentCommand.ts";
import { AssignmentRepository } from "../../../../ports/repositories/AssignmentRepository.ts";

/**
 * Handler for the DeleteAssignmentCommand
 */
export class DeleteAssignmentCommandHandler implements CommandHandler<DeleteAssignmentCommand, boolean> {
  constructor(private assignmentRepository: AssignmentRepository) {}

  /**
   * Execute the command to delete an assignment
   * @param command The command containing the assignment ID to delete
   * @returns True if the assignment was deleted, false otherwise
   */
  async execute(command: DeleteAssignmentCommand): Promise<boolean> {
    // Check if the assignment exists
    const existingAssignment = await this.assignmentRepository.findById(command.id);
    if (!existingAssignment) {
      throw new Error(`Assignment with ID ${command.id} not found`);
    }

    // Delete the assignment using the repository
    return await this.assignmentRepository.delete(command.id);
  }
}
