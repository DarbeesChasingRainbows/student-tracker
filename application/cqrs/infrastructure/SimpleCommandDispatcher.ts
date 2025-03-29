import { Command } from "../core/Command.ts";
import { CommandDispatcher } from "../core/CommandDispatcher.ts";
import { CommandHandler } from "../core/CommandHandler.ts";

/**
 * Simple implementation of the CommandDispatcher interface
 */
export class SimpleCommandDispatcher implements CommandDispatcher {
  private handlers = new Map<string, CommandHandler<any, any>>();

  /**
   * Registers a command handler for a specific command type
   * @param commandType The type of command to register the handler for
   * @param handler The handler to register
   */
  registerHandler<TCommand extends Command<TResult>, TResult>(
    commandType: string,
    handler: CommandHandler<TCommand, TResult>
  ): void {
    this.handlers.set(commandType, handler);
  }

  /**
   * Dispatches a command to its registered handler
   * @param command The command to dispatch
   * @returns The result of the command execution
   * @throws Error if no handler is registered for the command type
   */
  async dispatch<TCommand extends Command<TResult>, TResult>(
    command: TCommand
  ): Promise<TResult> {
    const handler = this.handlers.get(command.commandType);
    
    if (!handler) {
      throw new Error(`No handler registered for command type: ${command.commandType}`);
    }
    
    return handler.execute(command);
  }
}
