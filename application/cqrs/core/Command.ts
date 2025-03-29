/**
 * Base interface for all commands in the CQRS pattern
 * Commands represent write operations that change the state of the system
 */
export interface Command<TResult = void> {
  /**
   * Unique identifier for the command type
   * This helps with logging, debugging, and routing
   */
  readonly commandType: string;
}
