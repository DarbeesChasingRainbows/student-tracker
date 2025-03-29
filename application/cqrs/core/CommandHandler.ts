import { Command } from "./Command.ts";

/**
 * Interface for command handlers in the CQRS pattern
 * Command handlers execute the business logic for a specific command
 */
export interface CommandHandler<TCommand extends Command<TResult>, TResult = void> {
  /**
   * Executes the command and returns the result
   * @param command The command to execute
   */
  execute(command: TCommand): Promise<TResult>;
}
