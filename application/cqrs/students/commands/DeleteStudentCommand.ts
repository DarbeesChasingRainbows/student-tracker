import { Command } from "../../core/Command.ts";

/**
 * Command to delete a student
 */
export class DeleteStudentCommand implements Command<boolean> {
  readonly commandType = "DeleteStudent";

  constructor(
    public readonly id: string
  ) {}
}
