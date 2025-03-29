import { CommandHandler } from "../../core/CommandHandler.ts";
import { CreateAssignmentCommand } from "./CreateAssignmentCommand.ts";
import { Assignment, AssignmentStatus, createAssignment } from "../../../../domain/models/Assignment.ts";
import { AssignmentRepository } from "../../../../ports/repositories/AssignmentRepository.ts";

/**
 * Handler for the CreateAssignmentCommand
 */
export class CreateAssignmentCommandHandler implements CommandHandler<CreateAssignmentCommand, Assignment> {
  constructor(private assignmentRepository: AssignmentRepository) {}

  /**
   * Execute the command to create a new assignment
   * @param command The command containing assignment data
   * @returns The created assignment
   */
  async execute(command: CreateAssignmentCommand): Promise<Assignment> {
    // Create the assignment using the factory function
    const assignmentData = createAssignment(
      command.title,
      command.type,
      command.questionIds || [],
      command.createdBy,
      command.description,
      command.settings,
      command.dueDate
    );

    // Add status (not included in factory function)
    const assignmentWithStatus = {
      ...assignmentData,
      status: AssignmentStatus.DRAFT
    };

    // Save the assignment using the repository
    return await this.assignmentRepository.save(assignmentWithStatus);
  }
}
