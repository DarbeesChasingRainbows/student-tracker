import { Command } from "./Command.ts";
import { CommandHandler } from "./CommandHandler.ts";

/**
 * Interface for the command dispatcher in the CQRS pattern
 * The command dispatcher routes commands to their respective handlers
 */
export interface CommandDispatcher {
  /**
   * Registers a command handler for a specific command type
   * @param commandType The type of command to register the handler for
   * @param handler The handler to register
   */
  registerHandler<TCommand extends Command<TResult>, TResult>(
    commandType: string,
    handler: CommandHandler<TCommand, TResult>
  ): void;

  /**
   * Dispatches a command to its registered handler
   * @param command The command to dispatch
   * @returns The result of the command execution
   */
  dispatch<TCommand extends Command<TResult>, TResult>(
    command: TCommand
  ): Promise<TResult>;
}
