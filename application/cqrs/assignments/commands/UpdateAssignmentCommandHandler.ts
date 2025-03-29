import { CommandHandler } from "../../core/CommandHandler.ts";
import { UpdateAssignmentCommand } from "./UpdateAssignmentCommand.ts";
import { Assignment, AssignmentSettingsSchema } from "../../../../domain/models/Assignment.ts";
import { AssignmentRepository } from "../../../../ports/repositories/AssignmentRepository.ts";

/**
 * Handler for the UpdateAssignmentCommand
 */
export class UpdateAssignmentCommandHandler implements CommandHandler<UpdateAssignmentCommand, Assignment> {
  constructor(private assignmentRepository: AssignmentRepository) {}

  /**
   * Execute the command to update an existing assignment
   * @param command The command containing updated assignment data
   * @returns The updated assignment
   * @throws Error if the assignment is not found
   */
  async execute(command: UpdateAssignmentCommand): Promise<Assignment> {
    // Check if the assignment exists
    const existingAssignment = await this.assignmentRepository.findById(command.id);
    if (!existingAssignment) {
      throw new Error(`Assignment with ID ${command.id} not found`);
    }

    // Create the assignment object from command data
    const assignmentData = {
      id: command.id,
      title: command.title,
      type: command.type,
      questionIds: command.questionIds,
      createdBy: command.createdBy,
      status: command.status,
      settings: AssignmentSettingsSchema.parse(command.settings || {}),
      description: command.description,
      dueDate: command.dueDate
    };

    // Save the updated assignment using the repository
    return await this.assignmentRepository.save(assignmentData);
  }
}
