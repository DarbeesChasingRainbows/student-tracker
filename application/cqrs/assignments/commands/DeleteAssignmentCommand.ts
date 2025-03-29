import { Command } from "../../core/Command.ts";

/**
 * Command to delete an assignment
 */
export class DeleteAssignmentCommand implements Command<boolean> {
  readonly commandType = "DeleteAssignment";

  constructor(
    public readonly id: string
  ) {}
}
