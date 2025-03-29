import { Command } from "../../core/Command.ts";
import { Assignment, AssignmentType, AssignmentSettings, AssignmentStatus } from "../../../../domain/models/Assignment.ts";

/**
 * Command to update an existing assignment
 */
export class UpdateAssignmentCommand implements Command<Assignment> {
  readonly commandType = "UpdateAssignment";

  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly type: AssignmentType,
    public readonly questionIds: string[],
    public readonly createdBy: string,
    public readonly status: AssignmentStatus,
    public readonly settings: Partial<AssignmentSettings>,
    public readonly description?: string,
    public readonly dueDate?: Date
  ) {}
}
