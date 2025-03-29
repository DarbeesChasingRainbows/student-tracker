import { Command } from "../../core/Command.ts";
import { Assignment, AssignmentType, AssignmentSettings } from "../../../../domain/models/Assignment.ts";

/**
 * Command to create a new assignment
 */
export class CreateAssignmentCommand implements Command<Assignment> {
  readonly commandType = "CreateAssignment";

  constructor(
    public readonly title: string,
    public readonly type: AssignmentType,
    public readonly questionIds: string[],
    public readonly createdBy: string,
    public readonly description?: string,
    public readonly settings?: Partial<AssignmentSettings>,
    public readonly dueDate?: Date
  ) {}
}
