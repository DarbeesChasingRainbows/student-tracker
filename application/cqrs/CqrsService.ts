import { Command } from "./core/Command.ts";
import { Query } from "./core/Query.ts";
import { CqrsRegistry } from "./CqrsRegistry.ts";

/**
 * Service for dispatching commands and queries
 * This provides a simplified interface for using the CQRS pattern
 */
export class CqrsService {
  /**
   * Execute a command
   * @param command The command to execute
   * @returns The result of the command execution
   */
  static async executeCommand<TCommand extends Command<TResult>, TResult>(
    command: TCommand
  ): Promise<TResult> {
    const dispatcher = CqrsRegistry.getCommandDispatcher();
    return await dispatcher.dispatch(command);
  }

  /**
   * Execute a query
   * @param query The query to execute
   * @returns The result of the query execution
   */
  static async executeQuery<TQuery extends Query<TResult>, TResult>(
    query: TQuery
  ): Promise<TResult> {
    const dispatcher = CqrsRegistry.getQueryDispatcher();
    return await dispatcher.dispatch(query);
  }
}
